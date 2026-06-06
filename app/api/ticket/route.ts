import { NextRequest } from "next/server";
import { createTicketFromChat } from "@/lib/data";
import { getAuth } from "@/lib/auth";
import { resolveViewerOrgId } from "@/lib/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Escalation path from the chatbot: turn the customer's question into an open
// ticket and log an escalation event.
export async function POST(req: NextRequest) {
  let message: string;
  let subject: string | undefined;
  try {
    ({ message, subject } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!message || typeof message !== "string") {
    return Response.json({ error: 'Missing "message" string' }, { status: 400 });
  }
  try {
    const auth = await getAuth();
    const orgId = await resolveViewerOrgId();
    const ticketId = await createTicketFromChat(orgId, message, subject, auth?.id ?? null, auth?.email ?? null);
    return Response.json({ ok: true, ticketId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create ticket";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
