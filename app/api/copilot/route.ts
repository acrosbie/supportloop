import { NextRequest } from "next/server";
import { getStaffOrgId } from "@/lib/auth";
import { getTicket, getTicketMessages } from "@/lib/data";
import { MODEL_CLASSIFY, anthropic, parseJson, textOf } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

interface CopilotOut {
  summary: string;
  next_action: string;
  sentiment?: string;
}

// Agent copilot: summarize the ticket + suggest a concrete next action.
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
  const messages = await getTicketMessages(orgId, ticketId);
  const thread = messages.length ? messages.map((m) => `${m.role.toUpperCase()}: ${m.body}`).join("\n\n") : ticket.body;

  const system = `You assist a human support agent. Read the ticket and respond with ONLY a JSON object (no prose, no code fences):
{"summary":"<1-2 sentences: the customer's issue and where the conversation stands>",
 "next_action":"<one concrete next step for the agent to take>",
 "sentiment":"<one word: frustrated, neutral, confused, satisfied, or urgent>"}`;

  try {
    const msg = await anthropic().messages.create({
      model: MODEL_CLASSIFY,
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: `Subject: ${ticket.subject}\n\n${thread}` }],
    });
    const out = parseJson<CopilotOut>(textOf(msg));
    return Response.json({ ok: true, summary: out.summary, next_action: out.next_action, sentiment: out.sentiment });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Copilot failed" }, { status: 502 });
  }
}
