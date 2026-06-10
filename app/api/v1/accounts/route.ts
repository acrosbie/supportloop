import { NextRequest } from "next/server";
import { apiOrgId } from "@/lib/api-auth";
import { upsertAccount } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Provision (create or update) an account. Bearer = the org API key.
export async function POST(req: NextRequest) {
  const orgId = await apiOrgId(req);
  if (!orgId) return Response.json({ ok: false, error: "Invalid API key" }, { status: 401 });
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const name = typeof b.name === "string" ? b.name : undefined;
  const external_id = typeof b.external_id === "string" ? b.external_id : undefined;
  if (!name && !external_id) return Response.json({ ok: false, error: "name or external_id required" }, { status: 400 });
  try {
    const id = await upsertAccount(orgId, {
      name,
      external_id,
      plan: typeof b.plan === "string" ? b.plan : undefined,
      mrr: typeof b.mrr === "number" ? b.mrr : undefined,
      seats: typeof b.seats === "number" ? b.seats : undefined,
      status: typeof b.status === "string" ? b.status : undefined,
      health: typeof b.health === "string" ? b.health : undefined,
      domain: typeof b.domain === "string" ? b.domain : undefined,
      industry: typeof b.industry === "string" ? b.industry : undefined,
    });
    return Response.json({ ok: true, id });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
