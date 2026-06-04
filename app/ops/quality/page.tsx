import PreviewBadge from "@/components/PreviewBadge";

const SUMMARY = [
  { label: "Grounded-rate", value: "92%", sub: "answers backed by KB" },
  { label: "Pass-rate", value: "95%", sub: "correct answer / escalate" },
  { label: "Avg similarity", value: "0.63", sub: "top retrieved match" },
];

const RESULTS = [
  { q: "How do I reset my password?", expected: "answer", grounded: true, pass: true },
  { q: "I was charged twice this month.", expected: "answer", grounded: true, pass: true },
  { q: "What are the recording storage limits?", expected: "answer", grounded: true, pass: true },
  { q: "How do I get an editable transcript of a meeting?", expected: "escalate", grounded: false, pass: true },
  { q: "How do I create breakout rooms?", expected: "escalate", grounded: false, pass: true },
  { q: "What is your GDPR data retention policy?", expected: "escalate", grounded: false, pass: true },
];

function Tick({ ok }: { ok: boolean }) {
  return <span className={ok ? "text-green-600" : "text-muted"}>{ok ? "✓" : "—"}</span>;
}

export default function Quality() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Quality / Evals</h1>
          <p className="mt-1 text-muted">Measuring reply quality — the difference between a demo and a system.</p>
        </div>
        <div className="flex items-center gap-3">
          <button disabled className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg opacity-70">
            Run eval
          </button>
          <PreviewBadge phase="Phase 2" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {SUMMARY.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-5">
            <div className="text-sm text-muted">{s.label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="mt-1 text-xs text-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-medium">Golden question</th>
              <th className="px-4 py-2.5 font-medium">Expected</th>
              <th className="px-4 py-2.5 font-medium">Grounded</th>
              <th className="px-4 py-2.5 font-medium">Pass</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {RESULTS.map((r) => (
              <tr key={r.q}>
                <td className="px-4 py-3">{r.q}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${r.expected === "answer" ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                    {r.expected}
                  </span>
                </td>
                <td className="px-4 py-3"><Tick ok={r.grounded} /></td>
                <td className="px-4 py-3"><Tick ok={r.pass} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted">
        Each run pushes the golden set through the real chat pipeline and grades grounding + correct
        escalate-behavior with Haiku, then stores the run so quality is tracked over time.
      </p>
    </div>
  );
}
