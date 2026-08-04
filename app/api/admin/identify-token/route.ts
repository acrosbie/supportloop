import { NextRequest } from "next/server";
import { orgIdWithPermission } from "@/lib/auth";
import { getOrgSettings } from "@/lib/org";
import { signJwt } from "@/lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generate a sample identity token (signed with the org's JWT secret) so the
// admin can test the identify handshake. Requires settings.manage.
export async function POST(req: NextRequest) {
  const orgId = await orgIdWithPermission("settings.manage");
  if (!orgId) return Response.json({ ok: false, error: "Admin only" }, { status: 403 });
  const settings = await getOrgSettings(orgId);
  if (!settings.jwtSecret) return Response.json({ ok: false, error: "Set + save a JWT secret first" }, { status: 400 });
  let b: { email?: unknown; name?: unknown; account?: unknown } = {};
  try {
    b = await req.json();
  } catch {
    /* defaults */
  }
  const email = typeof b.email === "string" && b.email.trim() ? b.email.trim() : "demo.user@example.com";
  const name = typeof b.name === "string" && b.name.trim() ? b.name.trim() : "Demo User";
  const account = typeof b.account === "string" && b.account.trim() ? b.account.trim() : "Demo Account";
  const token = signJwt({ email, name, account }, settings.jwtSecret, 3600);
  return Response.json({ ok: true, token });
}
