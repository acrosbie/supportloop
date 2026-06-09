import { NextRequest } from "next/server";
import { orgIdWithPermission } from "@/lib/auth";
import { runTicketCreated } from "@/lib/workflows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Manually (re-)run the ticket.created workflows for a ticket — for the agent
// to trigger automation on an existing ticket.
export async function POST(req: NextRequest) {
  const orgId = await orgIdWithPermission("workflows.manage");
  if (!orgId) return Response.json({ ok: false, error: "You don't have permission to run workflows." }, { status: 403 });
  let ticketId: unknown;
  try {
    ({ ticketId } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof ticketId !== "string") return Response.json({ ok: false, error: "ticketId required" }, { status: 400 });
  try {
    await runTicketCreated(orgId, ticketId);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
