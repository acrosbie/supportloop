import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { updateTicketFields, type TicketFields } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  try {
    await updateTicketFields(ticketId, fields);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Update failed" }, { status: 500 });
  }
}
