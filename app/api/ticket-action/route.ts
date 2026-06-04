import { NextRequest } from "next/server";
import { appendAgentReply, resolveTicket } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Agent actions on a ticket: send a reply, resolve, or both.
export async function POST(req: NextRequest) {
  let ticketId: string;
  let action: string;
  let body: string | undefined;
  try {
    ({ ticketId, action, body } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!ticketId || !action) {
    return Response.json({ error: "ticketId and action are required" }, { status: 400 });
  }

  try {
    if (action === "send") {
      if (!body?.trim()) return Response.json({ error: "Reply body is empty" }, { status: 400 });
      await appendAgentReply(ticketId, body);
    } else if (action === "resolve") {
      await resolveTicket(ticketId);
    } else if (action === "send_resolve") {
      if (body?.trim()) await appendAgentReply(ticketId, body);
      await resolveTicket(ticketId);
    } else {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Action failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
