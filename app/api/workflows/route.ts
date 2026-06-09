import { NextRequest } from "next/server";
import { orgIdWithPermission } from "@/lib/auth";
import { setWorkflowEnabled } from "@/lib/workflows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Enable/disable a workflow.
export async function PATCH(req: NextRequest) {
  const orgId = await orgIdWithPermission("workflows.manage");
  if (!orgId) return Response.json({ ok: false, error: "You don't have permission to manage workflows." }, { status: 403 });
  let id: unknown;
  let enabled: unknown;
  try {
    ({ id, enabled } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof id !== "string" || typeof enabled !== "boolean") {
    return Response.json({ ok: false, error: "id + enabled required" }, { status: 400 });
  }
  try {
    await setWorkflowEnabled(orgId, id, enabled);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
