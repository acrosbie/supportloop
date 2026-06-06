import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { setUserRole } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Change a user's role. Admin only.
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth || auth.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  let userId: string;
  let role: string;
  try {
    ({ userId, role } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!userId || !["customer", "agent", "admin"].includes(role)) {
    return Response.json({ error: "userId and a valid role are required" }, { status: 400 });
  }
  if (!auth.orgId) return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    await setUserRole(auth.orgId, userId, role as "customer" | "agent" | "admin");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
