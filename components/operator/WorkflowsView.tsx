"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Workflow as WorkflowIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkflowBuilder from "@/components/operator/WorkflowBuilder";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const STEP_LABEL: Record<string, string> = {
  triage: "AI triage",
  priority_by_account: "Prioritize by account",
  draft_reply: "Draft grounded reply",
  extract_fields: "Extract custom fields",
  escalate: "Escalate ticket",
  flag_account_at_risk: "Flag account at-risk",
  add_internal_note: "Add internal note",
  set_customer_field: "Set customer field",
};
const OP_LABEL: Record<string, string> = { eq: "=", ne: "≠", lt: "<", lte: "≤", gt: ">", gte: "≥", contains: "contains", in: "in" };

interface Predicate {
  field: string;
  op: string;
  value: unknown;
}
interface Wf {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  steps: { type: string }[];
  condition?: { all?: Predicate[] };
  runCount: number;
  lastRunAt: string | null;
}
interface Run {
  id: string;
  workflow_name: string;
  ticket_id: string | null;
  status: string;
  stepCount: number;
  created_at: string;
}

export default function WorkflowsView({ workflows, runs }: { workflows: Wf[]; runs: Run[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);

  async function sweep() {
    setSweeping(true);
    try {
      const r = await fetch("/api/sla/sweep", { method: "POST" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success(j.fired > 0 ? `Fired ${j.fired} SLA-breach workflow${j.fired === 1 ? "" : "s"}` : "No new SLA breaches");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSweeping(false);
    }
  }

  async function toggle(id: string, enabled: boolean) {
    setBusy(id);
    try {
      const r = await fetch("/api/workflows", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success(enabled ? "Workflow enabled" : "Workflow disabled");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this workflow?")) return;
    setBusy(id);
    try {
      const r = await fetch("/api/workflows", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success("Workflow deleted");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
          <p className="mt-1 text-muted">Automations that run on a trigger — LLM + deterministic steps acting on the ticket, customer, and account.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={sweep} disabled={sweeping}>
            {sweeping ? "Sweeping…" : "Run SLA sweep"}
          </Button>
          <Button size="sm" onClick={() => setShowBuilder((s) => !s)}>
            {showBuilder ? "Close" : "New workflow"}
          </Button>
        </div>
      </div>

      {showBuilder && (
        <div className="mt-4">
          <WorkflowBuilder onDone={() => setShowBuilder(false)} />
        </div>
      )}

      {workflows.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={WorkflowIcon}
          title="No workflows yet"
          description="Apply 0009_workflows.sql and run npm run seed to load the default 'New ticket intake' workflow."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {workflows.map((w) => (
            <div key={w.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{w.name}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    on <span className="font-mono">{w.trigger}</span> · {w.runCount} run{w.runCount === 1 ? "" : "s"}
                    {w.lastRunAt ? ` · last ${new Date(w.lastRunAt).toLocaleDateString()}` : ""}
                  </div>
                  {w.condition?.all && w.condition.all.length > 0 && (
                    <div className="mt-1 text-xs text-muted">
                      when{" "}
                      {w.condition.all.map((p, i) => (
                        <span key={i}>
                          {i > 0 ? " and " : ""}
                          <span className="font-mono text-foreground/80">
                            {p.field} {OP_LABEL[p.op] ?? p.op} {String(p.value)}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => toggle(w.id, !w.enabled)}
                    disabled={busy === w.id}
                    aria-label={w.enabled ? "Disable workflow" : "Enable workflow"}
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50",
                      w.enabled ? "bg-accent" : "bg-border-strong"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
                        w.enabled ? "left-[18px]" : "left-0.5"
                      )}
                    />
                  </button>
                  <button
                    onClick={() => remove(w.id)}
                    disabled={busy === w.id}
                    aria-label="Delete workflow"
                    className="text-muted transition-colors hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {w.steps.map((s, i) => (
                  <span key={i} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-foreground/80">
                    {i + 1}. {STEP_LABEL[s.type] ?? s.type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-sm font-medium">Recent runs</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[30rem] text-sm">
          <tbody className="divide-y divide-border">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-surface-2">
                <td className="px-4 py-2.5">
                  <span className="font-medium">{run.workflow_name}</span>
                  <span className="ml-2 text-xs text-muted">{run.stepCount} steps</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={run.status === "error" ? "text-danger" : "text-success"}>{run.status}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {run.ticket_id ? (
                    <Link href={`/agent/ticket/${run.ticket_id}`} className="text-xs text-accent-strong hover:underline">
                      view ticket
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 pr-4 text-right text-xs text-muted">{new Date(run.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                  No runs yet — submit a request (or open a ticket and click “Run intake”).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
