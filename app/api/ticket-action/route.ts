import { NextRequest } from "next/server";
import { appendAgentReply, resolveTicket } from "@/lib/data";
import { getStaffOrgId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Agent actions on a ticket: send a reply, resolve, or both.
export async function POST(req: NextRequest) {
  let ticketId: string;
  let action: string;
  let body: string | undefined;
  let internal: boolean | undefined;
  try {
    ({ ticketId, action, body, internal } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!ticketId || !action) {
    return Response.json({ error: "ticketId and action are required" }, { status: 400 });
  }

  const orgId = await getStaffOrgId();
  if (!orgId) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    if (action === "send") {
      if (!body?.trim()) return Response.json({ error: "Reply body is empty" }, { status: 400 });
      await appendAgentReply(orgId, ticketId, body, !!internal);
    } else if (action === "resolve") {
      await resolveTicket(orgId, ticketId);
    } else if (action === "send_resolve") {
      if (body?.trim()) await appendAgentReply(orgId, ticketId, body, !!internal);
      await resolveTicket(orgId, ticketId);
    } else {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Action failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
