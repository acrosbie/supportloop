import PreviewBadge from "@/components/PreviewBadge";

const QUESTIONS = [
  { title: "How do I reset my password if I forgot it?", answers: 1, state: "answered" },
  { title: "People can't hear me even though my mic isn't muted", answers: 1, state: "answered" },
  { title: "Can I get a written transcript of a past meeting?", answers: 0, state: "gap" },
  { title: "How do I create breakout rooms for group discussions?", answers: 0, state: "gap" },
  { title: "Do you support custom virtual backgrounds?", answers: 0, state: "gap" },
  { title: "What are the cloud recording storage limits on Pro?", answers: 1, state: "answered" },
  { title: "How do I require 2FA for my whole organization?", answers: 0, state: "open" },
];

function StatePill({ state }: { state: string }) {
  const map: Record<string, string> = {
    answered: "bg-green-50 text-green-700 border-green-200",
    gap: "bg-amber-50 text-amber-700 border-amber-200",
    open: "bg-surface-2 text-muted border-border",
  };
  const label = state === "gap" ? "Knowledge gap" : state === "answered" ? "Answered" : "Open";
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${map[state]}`}>{label}</span>;
}

export default function Community() {
  const gaps = QUESTIONS.filter((q) => q.state === "gap");
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Community</h1>
          <p className="mt-1 text-muted">Ask the community — and let AI suggest answers from the help center.</p>
        </div>
        <PreviewBadge phase="Phase 3" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-border rounded-xl border border-border bg-white">
            {QUESTIONS.map((q) => (
              <li key={q.title} className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="text-sm font-medium">{q.title}</div>
                  <div className="mt-1 text-xs text-muted">{q.answers} answer{q.answers === 1 ? "" : "s"}</div>
                </div>
                <StatePill state={q.state} />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="font-medium text-amber-800">Knowledge gaps</div>
            <p className="mt-1 text-sm text-amber-700">
              Questions the KB can't answer well. Each one becomes a draft article in the Agent → Knowledge Loop.
            </p>
            <ul className="mt-3 space-y-2">
              {gaps.map((g) => (
                <li key={g.title} className="text-sm text-amber-900">• {g.title}</li>
              ))}
            </ul>
          </div>
          <button disabled className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg opacity-70">
            Ask a question
          </button>
        </div>
      </div>
    </div>
  );
}
