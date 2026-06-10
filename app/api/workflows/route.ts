import { NextRequest } from "next/server";
import { orgIdWithPermission } from "@/lib/auth";
import { setWorkflowEnabled, createWorkflow, deleteWorkflow, type WorkflowStep, type Condition } from "@/lib/workflows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRIGGERS = ["ticket.created", "csat.submitted", "status.changed", "sla.breach", "webhook.received"];
const STEP_TYPES = [
  "triage",
  "priority_by_account",
  "draft_reply",
  "extract_fields",
  "escalate",
  "flag_account_at_risk",
  "add_internal_note",
  "set_customer_field",
];

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

// Create a workflow.
export async function POST(req: NextRequest) {
  const orgId = await orgIdWithPermission("workflows.manage");
  if (!orgId) return Response.json({ ok: false, error: "You don't have permission to manage workflows." }, { status: 403 });
  let body: { name?: unknown; trigger?: unknown; condition?: unknown; steps?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const trigger = typeof body.trigger === "string" ? body.trigger : "";
  if (!name) return Response.json({ ok: false, error: "name required" }, { status: 400 });
  if (!TRIGGERS.includes(trigger)) return Response.json({ ok: false, error: "invalid trigger" }, { status: 400 });

  const rawSteps = Array.isArray(body.steps) ? (body.steps as Array<Record<string, unknown>>) : [];
  const steps: WorkflowStep[] = [];
  for (const s of rawSteps) {
    if (!s || typeof s.type !== "string" || !STEP_TYPES.includes(s.type)) continue;
    const step: WorkflowStep = { type: s.type as WorkflowStep["type"] };
    if (s.type === "add_internal_note" && typeof s.message === "string") step.message = s.message.slice(0, 300);
    if (s.type === "set_customer_field") {
      if (typeof s.field === "string") step.field = s.field.slice(0, 60);
      step.value = typeof s.value === "string" ? s.value.slice(0, 200) : (s.value ?? null);
    }
    steps.push(step);
  }
  if (!steps.length) return Response.json({ ok: false, error: "add at least one step" }, { status: 400 });

  let condition: Condition = {};
  const c = body.condition as { all?: unknown } | undefined;
  if (c && Array.isArray(c.all)) {
    const preds = (c.all as Array<Record<string, unknown>>)
      .filter((p) => p && typeof p.field === "string" && typeof p.op === "string")
      .map((p) => ({ field: (p.field as string).slice(0, 60), op: p.op as string, value: p.value }));
    if (preds.length) condition = { all: preds };
  }

  try {
    await createWorkflow(orgId, { name: name.slice(0, 60), trigger, condition, steps });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

// Delete a workflow.
export async function DELETE(req: NextRequest) {
  const orgId = await orgIdWithPermission("workflows.manage");
  if (!orgId) return Response.json({ ok: false, error: "You don't have permission to manage workflows." }, { status: 403 });
  let id: unknown;
  try {
    ({ id } = await req.json());
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof id !== "string") return Response.json({ ok: false, error: "id required" }, { status: 400 });
  try {
    await deleteWorkflow(orgId, id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
