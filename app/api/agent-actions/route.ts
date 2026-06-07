import { NextRequest } from "next/server";
import { getStaffOrgId } from "@/lib/auth";
import { getTicket, logAiTrace } from "@/lib/data";
import { MODEL_GENERATE, anthropic, textOf } from "@/lib/anthropic";
import { AGENT_TOOLS, lookupAccount, recentCharges } from "@/lib/agent-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 40;

// Agentic tool-use: the assistant investigates a ticket by calling tools, then
// recommends a resolution. A refund is PROPOSED (not executed) for human review.
export async function POST(req: NextRequest) {
  const orgId = await getStaffOrgId();
  if (!orgId) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  let ticketId: string;
  try {
    ({ ticketId } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const ticket = await getTicket(orgId, ticketId);
  if (!ticket) return Response.json({ ok: false, error: "Ticket not found" }, { status: 404 });

  const email = ticket.requester_email || "customer@orbit.demo";
  const steps: { tool: string; input: unknown; output: unknown }[] = [];
  let proposed: { tool: string; input: Record<string, unknown> } | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [
    {
      role: "user",
      content: `A customer (${email}) opened this ticket.\n\nSubject: ${ticket.subject}\n\n${ticket.body}\n\nInvestigate with the tools, then give a 1–2 sentence recommended resolution. If a refund is warranted, call issue_refund to PROPOSE it — never claim a refund was already issued.`,
    },
  ];
  const system =
    "You are an autonomous support agent for Orbit. Use the available tools to investigate before recommending anything. Be concise. Proposing a refund (issue_refund) is enough — a human will approve it.";

  let finalText = "";
  let inTok = 0;
  let outTok = 0;
  const t0 = Date.now();

  try {
    for (let iter = 0; iter < 4; iter++) {
      const resp = await anthropic().messages.create({
        model: MODEL_GENERATE,
        max_tokens: 600,
        system,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: AGENT_TOOLS as any,
        messages,
      });
      inTok += resp.usage.input_tokens;
      outTok += resp.usage.output_tokens;

      if (resp.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: resp.content });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toolResults: any[] = [];
        for (const block of resp.content) {
          if (block.type !== "tool_use") continue;
          const input = block.input as Record<string, unknown>;
          let output: unknown;
          if (block.name === "lookup_account") output = lookupAccount(String(input.email || email));
          else if (block.name === "recent_charges") output = recentCharges(String(input.email || email));
          else if (block.name === "issue_refund") {
            proposed = { tool: "issue_refund", input };
            output = { status: "proposed", note: "Awaiting human approval." };
          } else output = { error: "unknown tool" };
          steps.push({ tool: block.name, input, output });
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(output) });
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }
      finalText = textOf(resp);
      break;
    }
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Agent failed" }, { status: 502 });
  }

  await logAiTrace(orgId, {
    surface: "agent-actions",
    model: MODEL_GENERATE,
    latencyMs: Date.now() - t0,
    inputTokens: inTok,
    outputTokens: outTok,
    ticketId,
  });
  return Response.json({ ok: true, message: finalText, steps, proposed });
}
