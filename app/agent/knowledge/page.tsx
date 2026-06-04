import PreviewBadge from "@/components/PreviewBadge";

const RESOLVED = [
  { subject: "Can I get an editable transcript of a recorded meeting?", source: "Resolved ticket · hero", when: "today" },
  { subject: "How do I require 2FA for my whole organization?", source: "Community gap", when: "today" },
  { subject: "Set up SSO with Okta", source: "Resolved ticket", when: "yesterday" },
];

const DRAFTS = [
  { title: "Getting transcripts and captions for Orbit meetings", category: "Recording", from: "from hero ticket" },
  { title: "Enforce two-factor authentication org-wide", category: "Security & Admin", from: "from community gap" },
];

export default function KnowledgeLoop() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Knowledge Loop</h1>
          <p className="mt-1 text-muted">Turn resolved tickets and community gaps into reviewed knowledge.</p>
        </div>
        <PreviewBadge phase="Phase 2" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Source material */}
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Ready to document</h2>
          <ul className="mt-3 space-y-3">
            {RESOLVED.map((r) => (
              <li key={r.subject} className="rounded-xl border border-border bg-surface p-4">
                <div className="text-sm font-medium">{r.subject}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted">{r.source} · {r.when}</span>
                  <button disabled className="rounded-lg border border-border bg-surface px-3 py-1 text-xs text-foreground/70 opacity-70">
                    Generate article
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Draft review queue */}
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Draft review queue</h2>
          <ul className="mt-3 space-y-3">
            {DRAFTS.map((d) => (
              <li key={d.title} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-foreground/70">{d.category}</span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">Draft</span>
                </div>
                <div className="mt-2 text-sm font-medium">{d.title}</div>
                <div className="mt-1 text-xs text-muted">{d.from}</div>
                <div className="mt-3 flex gap-2">
                  <button disabled className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-fg opacity-70">
                    Publish
                  </button>
                  <button disabled className="rounded-lg border border-border bg-surface px-3 py-1 text-xs text-foreground/70 opacity-70">
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Publishing embeds the article so it immediately improves chatbot and agent-assist retrieval — closing the loop.
          </p>
        </div>
      </div>
    </div>
  );
}
