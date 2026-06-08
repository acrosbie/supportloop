"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Workflow, Check, AlertTriangle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";

interface StepLog {
  step: string;
  status: string;
  detail: string;
}
interface Run {
  id: string;
  workflow_name: string;
  status: string;
  steps: StepLog[];
  created_at: string;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />;
  if (status === "skipped") return <Minus className="mt-0.5 h-3 w-3 shrink-0 text-muted" />;
  return <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-danger" />;
}

export default function AutomationPanel({ ticketId, runs }: { ticketId: string; runs: Run[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function rerun() {
    setBusy(true);
    try {
      const r = await fetch("/api/workflows/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success("Workflow ran");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
          <Workflow className="h-3.5 w-3.5 text-accent-strong" /> Automation
        </div>
        <Button size="sm" variant="outline" onClick={rerun} disabled={busy}>
          {busy ? <Spinner className="h-3.5 w-3.5" /> : null}
          {busy ? "Running…" : "Run intake"}
        </Button>
      </div>

      {runs.length === 0 ? (
        <p className="mt-3 text-xs text-muted">No automation has run on this ticket yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {runs.map((run) => (
            <div key={run.id}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{run.workflow_name}</span>
                <span className="text-muted">{new Date(run.created_at).toLocaleString()}</span>
              </div>
              <ul className="mt-1.5 space-y-1">
                {run.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs">
                    <StatusIcon status={s.status} />
                    <span>
                      <span className="font-medium">{s.step}:</span>{" "}
                      <span className="text-muted">{s.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
