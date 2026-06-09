import { NextRequest } from "next/server";
import { orgIdWithPermission } from "@/lib/auth";
import { assignUserGroup } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Assign an agent to a group + group role. Requires team.manage.
export async function POST(req: NextRequest) {
  const orgId = await orgIdWithPermission("team.manage");
  if (!orgId) return Response.json({ ok: false, error: "You don't have permission to manage the team." }, { status: 403 });
  let userId: unknown;
  let groupId: unknown;
  let groupRole: unknown;
  try {
    ({ userId, groupId, groupRole } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof userId !== "string") return Response.json({ ok: false, error: "userId required" }, { status: 400 });
  const gid = typeof groupId === "string" && groupId ? groupId : null;
  const gr = groupRole === "admin" || groupRole === "member" ? groupRole : null;
  try {
    await assignUserGroup(orgId, userId, gid, gid ? gr ?? "member" : null);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
