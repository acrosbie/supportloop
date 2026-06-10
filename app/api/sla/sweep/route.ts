import { orgIdWithPermission } from "@/lib/auth";
import { runSlaSweep } from "@/lib/workflows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Manually run the SLA breach sweep for the staff member's org. Requires
// workflows.manage (it fires sla.breach workflows).
export async function POST() {
  const orgId = await orgIdWithPermission("workflows.manage");
  if (!orgId) return Response.json({ ok: false, error: "You don't have permission to run workflows." }, { status: 403 });
  try {
    const fired = await runSlaSweep(orgId);
    return Response.json({ ok: true, fired });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
