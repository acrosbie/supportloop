import PreviewBadge from "@/components/PreviewBadge";

const TICKETS = [
  { subject: "Can I get an editable transcript of a recorded meeting?", who: "priya@northwind.co", intent: "Recording", urgency: "medium", time: "2h", status: "open", hero: true },
  { subject: "Locked out of my account", who: "sam@acme.io", intent: "Account access", urgency: "high", time: "4h", status: "open", hero: false },
  { subject: "Charged twice this month", who: "lee@brightlabs.com", intent: "Billing", urgency: "medium", time: "5h", status: "open", hero: false },
  { subject: "Microphone not working", who: "dana@corner.dev", intent: "Audio & Video", urgency: "low", time: "1d", status: "assisted", hero: false },
  { subject: "Set up SSO with Okta", who: "it@globex.com", intent: "Security/SSO", urgency: "high", time: "1d", status: "open", hero: false },
  { subject: "Meeting ends at 40 minutes", who: "noah@studio.tv", intent: "Meetings", urgency: "low", time: "2d", status: "assisted", hero: false },
];

const urgencyDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

export default function AgentInbox() {
  const selected = TICKETS[0];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Inbox</h1>
          <div className="flex gap-1 text-xs">
            {["All", "Open", "Escalated"].map((f, i) => (
              <span key={f} className={`rounded-full px-2.5 py-1 ${i === 0 ? "bg-accent-soft text-accent-strong" : "text-muted"}`}>
                {f}
              </span>
            ))}
          </div>
        </div>
        <PreviewBadge phase="Phase 1" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[22rem_1fr]">
        {/* Ticket list */}
        <ul className="divide-y divide-border overflow-auto border-r border-border bg-surface">
          {TICKETS.map((t, i) => (
            <li
              key={i}
              className={`cursor-default px-4 py-3 ${t.hero ? "bg-accent-soft" : "hover:bg-surface-2"}`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${urgencyDot[t.urgency]}`} />
                <span className="truncate text-sm font-medium">{t.subject}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span className="truncate">{t.who}</span>
                <span>{t.time}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-foreground/70">{t.intent}</span>
                <span className="text-[11px] capitalize text-muted">{t.status}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* Detail + AI assist */}
        <div className="overflow-auto bg-surface-2 p-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{selected.subject}</h2>
                <div className="mt-1 text-xs text-muted">{selected.who} · chat · opened {selected.time} ago</div>
              </div>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs capitalize text-muted">{selected.status}</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="max-w-lg rounded-2xl rounded-tl-sm bg-surface-2 p-3 text-sm">
                We recorded our company all-hands last week and I need a written transcript I can edit and
                share — not just the video file. Under Recordings I only see video and audio downloads. Is
                there a way to get a text transcript in Orbit?
              </div>
            </div>
          </div>

          {/* AI Assist panel */}
          <div className="mt-4 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">AI Assist</div>
              <PreviewBadge phase="Phase 1" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="text-xs text-muted">Intent</div>
                <div className="text-sm font-medium">Recording</div>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="text-xs text-muted">Urgency</div>
                <div className="text-sm font-medium">Medium</div>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="text-xs text-muted">Sentiment</div>
                <div className="text-sm font-medium">Confused</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-muted">Suggested reply (grounded in KB)</div>
              <div className="mt-2 rounded-lg border border-dashed border-border bg-surface-2 p-4 text-sm text-muted">
                A Sonnet-drafted reply will stream here, grounded only in retrieved Orbit articles, with the
                source articles cited as chips. If the KB can't answer, the assistant recommends escalation
                instead of inventing a policy.
              </div>
              <div className="mt-3 flex gap-2">
                <button disabled className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg opacity-70">
                  Generate draft
                </button>
                <button disabled className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground/70 opacity-70">
                  Mark resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
