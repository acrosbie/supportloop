import { NextRequest } from "next/server";
import { getStaffOrgId } from "@/lib/auth";
import { getCustomFieldDefs, updateEntityFields } from "@/lib/data";
import { STANDARD_FIELDS, isFieldEntity, coerceFieldValue } from "@/lib/fields";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Update standard + custom field values for one record. Staff only. Values are
// whitelisted against the entity's standard fields + its custom-field defs and
// coerced by type; unknown keys are ignored.
export async function PATCH(req: NextRequest) {
  const orgId = await getStaffOrgId();
  if (!orgId) return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });

  let entity: unknown;
  let id: unknown;
  let values: unknown;
  try {
    ({ entity, id, values } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isFieldEntity(entity) || typeof id !== "string" || typeof values !== "object" || !values) {
    return Response.json({ ok: false, error: "entity, id and values are required" }, { status: 400 });
  }

  const stdType = new Map(STANDARD_FIELDS[entity].map((f) => [f.key, f.type]));
  const defs = await getCustomFieldDefs(orgId, entity);
  const customType = new Map(defs.map((d) => [d.key, d.type]));

  const standard: Record<string, unknown> = {};
  const custom: Record<string, unknown> = {};
  for (const [k, raw] of Object.entries(values as Record<string, unknown>)) {
    const st = stdType.get(k);
    if (st) {
      standard[k] = coerceFieldValue(st, raw);
      continue;
    }
    const ct = customType.get(k);
    if (ct) custom[k] = coerceFieldValue(ct, raw);
  }

  try {
    await updateEntityFields(orgId, entity, id, standard, custom);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
