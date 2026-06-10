import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { updateTicketFields, getTicket, type TicketFields } from "@/lib/data";
import { runStatusChanged } from "@/lib/workflows";
import { runInBackground } from "@/lib/async-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Edit ticket properties (priority/status/assignee/queue/tags). Agent/admin only.
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth || (auth.role !== "agent" && auth.role !== "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  let ticketId: string;
  let fields: TicketFields;
  try {
    ({ ticketId, fields } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!ticketId || !fields) return Response.json({ error: "ticketId and fields required" }, { status: 400 });
  if (!auth.orgId) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const before = fields.status ? await getTicket(auth.orgId, ticketId) : null;
    await updateTicketFields(auth.orgId, ticketId, fields);
    if (fields.status && before && before.status !== fields.status) {
      // Fire status.changed workflows (e.g. reopened → escalate) in the background.
      runInBackground(() => runStatusChanged(auth.orgId as string, ticketId));
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Update failed" }, { status: 500 });
  }
}
