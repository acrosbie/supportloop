import { NextRequest } from "next/server";
import { MODEL_CLASSIFY, anthropic, parseJson, textOf } from "@/lib/anthropic";
import { getTicket, saveTriage, logAiTrace, type Triage } from "@/lib/data";
import { getStaffOrgId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

// Classify a ticket with Haiku (fast/cheap) and persist the triage onto the row.
export async function POST(req: NextRequest) {
  let ticketId: string;
  try {
    ({ ticketId } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const orgId = await getStaffOrgId();
  if (!orgId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const ticket = await getTicket(orgId, ticketId);
  if (!ticket) return Response.json({ error: "Ticket not found" }, { status: 404 });

  const system = `You triage customer support tickets for Orbit, a video meeting and collaboration product.
Respond with ONLY a JSON object (no prose, no code fences):
{"intent":"<short topic such as Billing, Account access, Audio & Video, Recording, Meetings, Security/SSO, Plans & upgrades>",
 "urgency":"low" | "medium" | "high",
 "queue":"Billing" | "Technical" | "Account" | "Recordings" | "Admin",
 "sentiment":"<one word: frustrated, neutral, confused, satisfied, or urgent>"}`;

  try {
    const t0 = Date.now();
    const msg = await anthropic().messages.create({
      model: MODEL_CLASSIFY,
      max_tokens: 200,
      system,
      messages: [{ role: "user", content: `Subject: ${ticket.subject}\n\n${ticket.body}` }],
    });
    const triage = parseJson<Triage>(textOf(msg));
    await saveTriage(orgId, ticketId, triage);
    await logAiTrace(orgId, {
      surface: "triage",
      model: MODEL_CLASSIFY,
      latencyMs: Date.now() - t0,
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
      ticketId,
    });
    return Response.json(triage);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Triage failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}
