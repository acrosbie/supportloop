"use client";

import { useState } from "react";
import { Check, Minus, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toaster";

interface ResultRow {
  question: string;
  expected: string;
  grounded: boolean;
  pass: boolean;
  similarity: number;
}
export interface EvalSummary {
  total: number;
  grounded: number;
  passed: number;
  avg_similarity: number;
  results: ResultRow[];
  createdAt?: string;
}

function Tick({ ok }: { ok: boolean }) {
  return ok ? <Check className="h-4 w-4 text-success" /> : <Minus className="h-4 w-4 text-muted" />;
}

export default function EvalRunner({ initial }: { initial: EvalSummary | null }) {
  const [run, setRun] = useState<EvalSummary | null>(initial);
  const [busy, setBusy] = useState(false);

  async function runEval() {
    setBusy(true);
    try {
      const res = await fetch("/api/eval", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Eval failed");
      setRun({ ...j, createdAt: new Date().toISOString() });
      toast.success(`Eval complete — ${j.passed}/${j.total} passed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eval failed");
    } finally {
      setBusy(false);
    }
  }

  const groundedRate = run && run.total ? Math.round((run.grounded / run.total) * 100) : 0;
  const passRate = run && run.total ? Math.round((run.passed / run.total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quality / Evals</h1>
          <p className="mt-1 text-muted">Measuring reply quality — the difference between a demo and a system.</p>
        </div>
        <Button onClick={runEval} disabled={busy}>
          <FlaskConical className="h-4 w-4" />
          {busy ? "Running…" : "Run eval"}
        </Button>
      </div>

      {!run ? (
        <EmptyState
          className="mt-6"
          icon={FlaskConical}
          title="No eval run yet"
          description="Run the golden questions through the real retrieval pipeline and grade grounding + escalate-behavior."
          action={
            <Button onClick={runEval} disabled={busy}>
              {busy ? "Running…" : "Run eval"}
            </Button>
          }
        />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Grounded-rate", value: `${groundedRate}%`, sub: "answers backed by KB" },
              { label: "Pass-rate", value: `${passRate}%`, sub: "correct answer / escalate" },
              { label: "Avg similarity", value: run.avg_similarity.toFixed(2), sub: "top retrieved match" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-surface p-5">
                <div className="text-sm text-muted">{s.label}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</div>
                <div className="mt-1 text-xs text-muted">{s.sub}</div>
              </div>
            ))}
          </div>

          {run.createdAt && (
            <div className="mt-3 text-xs text-muted">
              {run.passed}/{run.total} passed · last run {new Date(run.createdAt).toLocaleString()}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-medium">Golden question</th>
                  <th className="px-4 py-2.5 font-medium">Expected</th>
                  <th className="px-4 py-2.5 font-medium">Sim</th>
                  <th className="px-4 py-2.5 font-medium">Grounded</th>
                  <th className="px-4 py-2.5 font-medium">Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {run.results.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">{r.question}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.expected === "answer" ? "success" : "warning"}>{r.expected}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{r.similarity.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Tick ok={r.grounded} />
                    </td>
                    <td className="px-4 py-3">
                      <Tick ok={r.pass} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
