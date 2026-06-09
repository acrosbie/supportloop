import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { resolveViewerOrgId, getOrgIdBySlug } from "@/lib/org";
import { createLiveTicket } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Start a live chat: open a "live" ticket. The embeddable widget / hosted help
// center passes its org slug; in-app surfaces use the viewer's workspace.
export async function POST(req: NextRequest) {
  let orgSlug: string | undefined;
  try {
    ({ orgSlug } = await req.json());
  } catch {
    /* no body — fine */
  }
  const auth = await getAuth();
  const orgId = orgSlug ? await getOrgIdBySlug(orgSlug) : await resolveViewerOrgId();
  if (!orgId) return Response.json({ ok: false, error: "Unknown workspace" }, { status: 404 });
  try {
    const ticketId = await createLiveTicket(orgId, auth?.id ?? null, auth?.email ?? null);
    return Response.json({ ok: true, ticketId });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
