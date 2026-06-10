import { NextRequest } from "next/server";
import { getOrgBySlug, getOrgSettings } from "@/lib/org";
import { createTicketFromChat } from "@/lib/data";
import { runWebhookReceived } from "@/lib/workflows";
import { runInBackground } from "@/lib/async-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Inbound webhook: an external system creates a ticket in a workspace. Auth is a
// per-org bearer secret (Settings → webhook). Fires the webhook.received
// workflows in the background.
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const org = await getOrgBySlug(params.slug);
  if (!org) return Response.json({ ok: false, error: "Unknown workspace" }, { status: 404 });

  const settings = await getOrgSettings(org.id);
  const secret = settings.webhookSecret;
  if (!secret) return Response.json({ ok: false, error: "Webhook not configured for this workspace" }, { status: 403 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { subject?: unknown; body?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const text = typeof body.body === "string" ? body.body : "";
  if (!text.trim()) return Response.json({ ok: false, error: '"body" is required' }, { status: 400 });
  const subject = typeof body.subject === "string" ? body.subject : undefined;
  const email = typeof body.email === "string" ? body.email : undefined;

  try {
    const ticketId = await createTicketFromChat(org.id, text, subject, null, email ?? null, "webhook");
    runInBackground(() => runWebhookReceived(org.id, ticketId));
    return Response.json({ ok: true, ticketId });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
