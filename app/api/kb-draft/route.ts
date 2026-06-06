import { NextRequest } from "next/server";
import { MODEL_GENERATE, anthropic, parseJson, textOf } from "@/lib/anthropic";
import { getTicket, getTicketMessages, createDraftFromTicket, type DraftInput } from "@/lib/data";
import { getStaffOrgId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Draft a reusable KB article from a resolved ticket thread (Sonnet, JSON).
// Lands as a draft for human review — never auto-published.
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
  const messages = await getTicketMessages(orgId, ticketId);
  const thread = messages.map((m) => `${m.role.toUpperCase()}: ${m.body}`).join("\n\n");

  const system = `You write knowledge base articles for Orbit's help center from resolved support tickets.
Given the ticket conversation, produce ONE reusable help article. Respond with ONLY a JSON object (no prose, no code fences):
{"title":"<concise, searchable title>",
 "body":"<1-3 short plain-text paragraphs, no markdown headings>",
 "category":"<one of: Account, Audio & Video, Plans & Billing, Meetings, Recording, Security & Admin, Getting Started>",
 "tags":["<2-4 short lowercase tags>"]}
Write generically for all customers (no names or ticket-specific details). If the resolution isn't fully clear from the thread, write the best general guidance you can about the topic.`;

  try {
    const msg = await anthropic().messages.create({
      model: MODEL_GENERATE,
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: `Subject: ${ticket.subject}\n\n${thread}` }],
    });
    const draft = parseJson<DraftInput>(textOf(msg));
    if (!draft.title || !draft.body) throw new Error("Draft missing title or body");
    if (!Array.isArray(draft.tags)) draft.tags = [];
    if (!draft.category) draft.category = "General";
    const id = await createDraftFromTicket(orgId, ticketId, draft);
    return Response.json({ ok: true, id, draft });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Draft failed";
    return Response.json({ ok: false, error: msg }, { status: 502 });
  }
}
