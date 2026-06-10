import { NextRequest } from "next/server";
import { apiOrgId } from "@/lib/api-auth";
import { upsertCustomer, upsertAccount } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Provision (create or update) a customer by email; optionally link/create their
// account by name. Bearer = the org API key.
export async function POST(req: NextRequest) {
  const orgId = await apiOrgId(req);
  if (!orgId) return Response.json({ ok: false, error: "Invalid API key" }, { status: 401 });
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (!email) return Response.json({ ok: false, error: "email required" }, { status: 400 });

  let account_id: string | null = null;
  if (typeof b.account === "string" && b.account.trim()) {
    account_id = await upsertAccount(orgId, {
      name: b.account.trim(),
      external_id: typeof b.account_external_id === "string" ? b.account_external_id : undefined,
      plan: typeof b.plan === "string" ? b.plan : undefined,
    });
  }

  try {
    const id = await upsertCustomer(orgId, {
      email,
      name: typeof b.name === "string" ? b.name : undefined,
      title: typeof b.title === "string" ? b.title : undefined,
      phone: typeof b.phone === "string" ? b.phone : undefined,
      location: typeof b.location === "string" ? b.location : undefined,
      account_id,
      account_role: b.account_role === "admin" || b.account_role === "member" ? b.account_role : undefined,
      custom_fields:
        b.custom_fields && typeof b.custom_fields === "object" ? (b.custom_fields as Record<string, unknown>) : undefined,
    });
    return Response.json({ ok: true, id });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
