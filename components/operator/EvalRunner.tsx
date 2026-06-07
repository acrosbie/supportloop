"use client";

import { useState } from "react";
import { Check, Minus, FlaskConical, ShieldCheck, CheckCircle2, Gauge, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface ResultRow {
  question: string;
  expected: string;
  grounded: boolean;
  pass: boolean;
  similarity: number;
  faithful?: boolean | null;
}
export interface EvalSummary {
  total: number;
  grounded: number;
  passed: number;
  avg_similarity: number;
  results: ResultRow[];
  faithfulness_rate?: number | null;
  faithful_checked?: number;
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

  const cards: { label: string; value: string; sub: string; icon: LucideIcon; tone: string; bar?: number }[] = run
    ? [
        { label: "Grounded-rate", value: `${groundedRate}%`, sub: "answers backed by KB", icon: ShieldCheck, tone: "bg-success-soft text-success" },
        { label: "Pass-rate", value: `${passRate}%`, sub: "correct answer / escalate", icon: CheckCircle2, tone: "bg-accent-soft text-accent-strong", bar: passRate },
        { label: "Avg similarity", value: run.avg_similarity.toFixed(2), sub: "top retrieved match", icon: Gauge, tone: "bg-warning-soft text-warning" },
        {
          label: "Faithfulness",
          value: run.faithfulness_rate != null ? `${Math.round(run.faithfulness_rate * 100)}%` : "—",
          sub: `${run.faithful_checked ?? 0} answers judged`,
          icon: Sparkles,
          tone: "bg-accent-soft text-accent-strong",
        },
      ]
    : [];

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
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">{c.label}</span>
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", c.tone)}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-tight">{c.value}</div>
                  {c.bar !== undefined ? (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${c.bar}%` }} />
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-muted">{c.sub}</div>
                  )}
                </div>
              );
            })}
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
                  <th className="px-4 py-2.5 font-medium">Faithful</th>
                  <th className="px-4 py-2.5 font-medium">Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {run.results.map((r, i) => (
                  <tr key={i} className={cn(!r.pass && "bg-danger-soft/40")}>
                    <td className="px-4 py-3">{r.question}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.expected === "answer" ? "success" : "warning"}>{r.expected}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{r.similarity.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Tick ok={r.grounded} />
                    </td>
                    <td className="px-4 py-3">
                      {r.faithful == null ? <Minus className="h-4 w-4 text-muted" /> : <Tick ok={r.faithful} />}
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
