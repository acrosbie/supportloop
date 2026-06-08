import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { createCustomFieldDef, deleteCustomFieldDef } from "@/lib/data";
import { isFieldEntity } from "@/lib/fields";
import type { FieldType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: FieldType[] = ["text", "number", "select", "date", "checkbox"];

async function adminOrg(): Promise<string | null> {
  const auth = await getAuth();
  if (!auth || auth.role !== "admin" || !auth.orgId) return null;
  return auth.orgId;
}

// Admin defines a custom field.
export async function POST(req: NextRequest) {
  const orgId = await adminOrg();
  if (!orgId) return Response.json({ ok: false, error: "Admin only" }, { status: 403 });
  let body: { entity?: unknown; label?: unknown; type?: unknown; options?: unknown; required?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const { entity, label, type, options, required } = body;
  if (!isFieldEntity(entity) || typeof label !== "string" || !label.trim()) {
    return Response.json({ ok: false, error: "entity + label required" }, { status: 400 });
  }
  if (!TYPES.includes(type as FieldType)) {
    return Response.json({ ok: false, error: "invalid type" }, { status: 400 });
  }
  const opts = Array.isArray(options)
    ? options.filter((o): o is string => typeof o === "string" && o.trim().length > 0).map((o) => o.trim())
    : [];
  try {
    await createCustomFieldDef(orgId, {
      entity,
      label: label.trim().slice(0, 60),
      type: type as FieldType,
      options: opts,
      required: required === true,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

// Admin removes a custom field.
export async function DELETE(req: NextRequest) {
  const orgId = await adminOrg();
  if (!orgId) return Response.json({ ok: false, error: "Admin only" }, { status: 403 });
  let id: unknown;
  try {
    ({ id } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof id !== "string") return Response.json({ ok: false, error: "id required" }, { status: 400 });
  try {
    await deleteCustomFieldDef(orgId, id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
