import { NextRequest } from "next/server";
import { getOrgBySlug, getOrgSettings } from "@/lib/org";
import { verifyJwt } from "@/lib/jwt";
import { upsertCustomer, upsertAccount } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Intercom-style identity: the host app sends a JWT signed with the org's secret;
// we verify it and auto-provision the customer (+ account), returning who they are.
export async function POST(req: NextRequest) {
  let orgSlug: unknown;
  let token: unknown;
  try {
    ({ orgSlug, token } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof orgSlug !== "string" || typeof token !== "string") {
    return Response.json({ ok: false, error: "orgSlug and token required" }, { status: 400 });
  }
  const org = await getOrgBySlug(orgSlug);
  if (!org) return Response.json({ ok: false, error: "Unknown workspace" }, { status: 404 });
  const settings = await getOrgSettings(org.id);
  if (!settings.jwtSecret) return Response.json({ ok: false, error: "Identity not configured" }, { status: 403 });

  const payload = verifyJwt(token, settings.jwtSecret);
  if (!payload) return Response.json({ ok: false, error: "Invalid or expired token" }, { status: 401 });
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email) return Response.json({ ok: false, error: "token missing email" }, { status: 400 });

  try {
    let account_id: string | null = null;
    const account = typeof payload.account === "string" ? payload.account : undefined;
    if (account) {
      account_id = await upsertAccount(org.id, { name: account, plan: typeof payload.plan === "string" ? payload.plan : undefined });
    }
    const name = typeof payload.name === "string" ? payload.name : undefined;
    await upsertCustomer(org.id, { email, name, account_id });
    return Response.json({ ok: true, name: name ?? email.split("@")[0], email, account: account ?? null });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
