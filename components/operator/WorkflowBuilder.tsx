"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

const TRIGGERS = [
  { v: "ticket.created", label: "Ticket created" },
  { v: "csat.submitted", label: "CSAT submitted" },
  { v: "status.changed", label: "Status changed" },
  { v: "sla.breach", label: "SLA breached" },
  { v: "webhook.received", label: "Webhook received" },
];
const STEP_TYPES = [
  { type: "triage", label: "AI triage" },
  { type: "priority_by_account", label: "Prioritize by account" },
  { type: "draft_reply", label: "Draft grounded reply" },
  { type: "extract_fields", label: "Extract custom fields" },
  { type: "escalate", label: "Escalate ticket" },
  { type: "flag_account_at_risk", label: "Flag account at-risk" },
  { type: "add_internal_note", label: "Add internal note" },
  { type: "set_customer_field", label: "Set customer field" },
];
const OPS = ["eq", "ne", "lt", "lte", "gt", "gte", "contains", "in"];

interface Step {
  type: string;
  message?: string;
  field?: string;
  value?: string;
}

export default function WorkflowBuilder({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("ticket.created");
  const [condField, setCondField] = useState("");
  const [condOp, setCondOp] = useState("eq");
  const [condValue, setCondValue] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [addType, setAddType] = useState("triage");
  const [busy, setBusy] = useState(false);

  const patchStep = (i: number, p: Partial<Step>) => setSteps((s) => s.map((st, j) => (j === i ? { ...st, ...p } : st)));

  async function create() {
    setBusy(true);
    try {
      const condition = condField.trim() ? { all: [{ field: condField.trim(), op: condOp, value: condValue }] } : {};
      const r = await fetch("/api/workflows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, trigger, condition, steps }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success("Workflow created");
      router.refresh();
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP fast-track" className="field mt-1" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Trigger</span>
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="field mt-1">
            {TRIGGERS.map((t) => (
              <option key={t.v} value={t.v}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="text-xs font-medium text-muted">Condition (optional)</span>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input value={condField} onChange={(e) => setCondField(e.target.value)} placeholder="field · e.g. account.plan" className="field w-48" />
          <select value={condOp} onChange={(e) => setCondOp(e.target.value)} className="field w-24">
            {OPS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <input value={condValue} onChange={(e) => setCondValue(e.target.value)} placeholder="value" className="field w-32" />
        </div>
        <span className="mt-1 block text-[11px] text-muted">
          Blank field = always run. Use ticket.*, account.*, customer.* (e.g. ticket.csat, account.plan, ticket.custom_fields.key).
        </span>
      </div>

      <div>
        <span className="text-xs font-medium text-muted">Steps</span>
        <div className="mt-1 space-y-2">
          {steps.map((s, i) => {
            const meta = STEP_TYPES.find((t) => t.type === s.type);
            return (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
                <span className="text-xs font-medium">
                  {i + 1}. {meta?.label ?? s.type}
                </span>
                {s.type === "add_internal_note" && (
                  <input value={s.message ?? ""} onChange={(e) => patchStep(i, { message: e.target.value })} placeholder="note text" className="field flex-1" />
                )}
                {s.type === "set_customer_field" && (
                  <>
                    <input value={s.field ?? ""} onChange={(e) => patchStep(i, { field: e.target.value })} placeholder="field key" className="field w-32" />
                    <input value={s.value ?? ""} onChange={(e) => patchStep(i, { value: e.target.value })} placeholder="value" className="field w-28" />
                  </>
                )}
                <button onClick={() => setSteps((st) => st.filter((_, j) => j !== i))} className="ml-auto text-muted hover:text-danger" aria-label="Remove step">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {steps.length === 0 && <p className="text-xs text-muted">No steps yet — add at least one below.</p>}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <select value={addType} onChange={(e) => setAddType(e.target.value)} className="field w-52">
            {STEP_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => setSteps((s) => [...s, { type: addType }])}>
            <Plus className="h-3.5 w-3.5" /> Add step
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-t border-border pt-3">
        <Button size="sm" onClick={create} disabled={busy || !name.trim() || steps.length === 0}>
          {busy ? "Creating…" : "Create workflow"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
