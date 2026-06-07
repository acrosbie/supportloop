import { getAuth } from "@/lib/auth";
import { resolveViewerOrgId } from "@/lib/org";
import { createLiveTicket } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Start a live chat: open a "live" ticket in the viewer's workspace.
export async function POST() {
  const auth = await getAuth();
  const orgId = await resolveViewerOrgId();
  try {
    const ticketId = await createLiveTicket(orgId, auth?.id ?? null, auth?.email ?? null);
    return Response.json({ ok: true, ticketId });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
