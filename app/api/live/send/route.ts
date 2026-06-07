import { NextRequest } from "next/server";
import { getStaffOrgId } from "@/lib/auth";
import { resolveViewerOrgId } from "@/lib/org";
import { appendLiveMessage } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Persist a live-chat message. The sender's role is derived from auth, not the
// client: staff send as "agent", everyone else as "customer".
export async function POST(req: NextRequest) {
  let ticketId: string;
  let body: string;
  try {
    ({ ticketId, body } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (!ticketId || !body?.trim()) {
    return Response.json({ ok: false, error: "ticketId and body required" }, { status: 400 });
  }
  try {
    const staffOrg = await getStaffOrgId();
    if (staffOrg) {
      await appendLiveMessage(staffOrg, ticketId, "agent", body);
    } else {
      const orgId = await resolveViewerOrgId();
      await appendLiveMessage(orgId, ticketId, "customer", body);
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
