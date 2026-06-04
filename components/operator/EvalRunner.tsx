"use client";

import { useState } from "react";

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
  return <span className={ok ? "text-green-600" : "text-muted"}>{ok ? "✓" : "—"}</span>;
}

export default function EvalRunner({ initial }: { initial: EvalSummary | null }) {
  const [run, setRun] = useState<EvalSummary | null>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function runEval() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/eval", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Eval failed");
      setRun({ ...j, createdAt: new Date().toISOString() });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Eval failed");
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
          <h1 className="text-2xl font-semibold">Quality / Evals</h1>
          <p className="mt-1 text-muted">Measuring reply quality — the difference between a demo and a system.</p>
        </div>
        <button
          onClick={runEval}
          disabled={busy}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-60"
        >
          {busy ? "Running…" : "Run eval"}
        </button>
      </div>

      {err && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      {!run ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          No eval run yet. Click <span className="font-medium text-foreground">Run eval</span> to push the golden
          questions through the real retrieval pipeline and grade grounding + escalate-behavior.
        </div>
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
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          r.expected === "answer"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {r.expected}
                      </span>
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
