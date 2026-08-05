import { NextRequest } from "next/server";
import { createTicketFromChat } from "@/lib/data";
import { runTicketCreated } from "@/lib/workflows";
import { runInBackground } from "@/lib/async-run";
import { getAuth } from "@/lib/auth";
import { resolveViewerOrgId, getOrgIdBySlug, getOrgSettings } from "@/lib/org";
import { verifyJwt } from "@/lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Escalation path from the chatbot: turn the customer's question into an open
// ticket and log an escalation event.
export async function POST(req: NextRequest) {
  let message: string;
  let subject: string | undefined;
  let orgSlug: string | undefined;
  let email: string | undefined;
  let channel: string | undefined;
  let identityToken: string | undefined;
  let sessionId: string | undefined;
  try {
    ({ message, subject, orgSlug, email, channel, identityToken, sessionId } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!message || typeof message !== "string") {
    return Response.json({ error: 'Missing "message" string' }, { status: 400 });
  }
  try {
    const auth = await getAuth();
    const orgId = orgSlug ? await getOrgIdBySlug(orgSlug) : await resolveViewerOrgId();
    if (!orgId) return Response.json({ ok: false, error: "Unknown workspace" }, { status: 404 });

    // An external identity token (the /api/identify handshake) is re-verified
    // here rather than trusted from the client, so a widget visitor's ticket
    // attaches to their real customer record and can't be spoofed by body.email.
    let verifiedEmail: string | null = null;
    if (typeof identityToken === "string" && identityToken) {
      const { jwtSecret } = await getOrgSettings(orgId);
      if (jwtSecret) {
        const payload = verifyJwt(identityToken, jwtSecret);
        if (payload && typeof payload.email === "string") verifiedEmail = payload.email.trim() || null;
      }
    }

    const ticketId = await createTicketFromChat(
      orgId,
      message,
      subject,
      auth?.id ?? null,
      auth?.email ?? verifiedEmail ?? email ?? null,
      channel ?? "chat",
      typeof sessionId === "string" && sessionId ? sessionId.slice(0, 64) : null
    );
    // Fire the ticket.created workflows (triage, route, draft, extract) AFTER the
    // response — keeps ticket submission snappy; waitUntil keeps it running.
    runInBackground(() => runTicketCreated(orgId, ticketId));
    return Response.json({ ok: true, ticketId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create ticket";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
