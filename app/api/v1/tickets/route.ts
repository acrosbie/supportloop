import { NextRequest } from "next/server";
import { apiOrgId } from "@/lib/api-auth";
import { createTicketFromChat } from "@/lib/data";
import { runTicketCreated } from "@/lib/workflows";
import { runInBackground } from "@/lib/async-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Create a ticket on behalf of a customer (linked by email). Fires the
// ticket.created intake workflows in the background. Bearer = the org API key.
export async function POST(req: NextRequest) {
  const orgId = await apiOrgId(req);
  if (!orgId) return Response.json({ ok: false, error: "Invalid API key" }, { status: 401 });
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const text = typeof b.body === "string" ? b.body : "";
  if (!text.trim()) return Response.json({ ok: false, error: '"body" is required' }, { status: 400 });
  const subject = typeof b.subject === "string" ? b.subject : undefined;
  const email = typeof b.email === "string" ? b.email : undefined;
  try {
    const ticketId = await createTicketFromChat(orgId, text, subject, null, email ?? null, "api");
    runInBackground(() => runTicketCreated(orgId, ticketId));
    return Response.json({ ok: true, ticketId });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
