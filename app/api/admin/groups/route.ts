import { NextRequest } from "next/server";
import { orgIdWithPermission } from "@/lib/auth";
import { createGroup } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create an agent group. Requires team.manage.
export async function POST(req: NextRequest) {
  const orgId = await orgIdWithPermission("team.manage");
  if (!orgId) return Response.json({ ok: false, error: "You don't have permission to manage the team." }, { status: 403 });
  let name: unknown;
  try {
    ({ name } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim()) {
    return Response.json({ ok: false, error: "name required" }, { status: 400 });
  }
  try {
    await createGroup(orgId, name);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
