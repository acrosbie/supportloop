import PreviewBadge from "@/components/PreviewBadge";
import SampleVolumeChart from "@/components/operator/SampleVolumeChart";

const METRICS = [
  { label: "Deflection rate", value: "67%", sub: "resolved without an agent" },
  { label: "Automation rate", value: "41%", sub: "AI-assisted resolutions" },
  { label: "Avg CSAT", value: "4.4", sub: "of 5, last 90 days" },
  { label: "Tickets (90d)", value: "201", sub: "across all channels" },
];

const INTENTS = [
  { name: "Billing", pct: 24 },
  { name: "Audio & Video", pct: 21 },
  { name: "Account access", pct: 16 },
  { name: "Meetings", pct: 14 },
  { name: "Recording", pct: 13 },
  { name: "Security/SSO", pct: 12 },
];

export default function OpsDashboard() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ops Dashboard</h1>
          <p className="mt-1 text-muted">The business view — does the AI actually move a metric?</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
            <span className="rounded-md bg-accent px-2.5 py-1 font-medium text-accent-fg">All time</span>
            <span className="px-2.5 py-1 text-muted">Today</span>
          </div>
          <PreviewBadge phase="Phase 2" />
        </div>
      </div>

      {/* Metric cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-surface p-5">
            <div className="text-sm text-muted">{m.label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{m.value}</div>
            <div className="mt-1 text-xs text-muted">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Volume chart */}
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Ticket volume</div>
            <div className="text-xs text-muted">last 14 days</div>
          </div>
          <div className="mt-3">
            <SampleVolumeChart />
          </div>
        </div>

        {/* Top intents */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="text-sm font-medium">Top intents</div>
          <ul className="mt-4 space-y-3">
            {INTENTS.map((it) => (
              <li key={it.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/80">{it.name}</span>
                  <span className="text-muted">{it.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${it.pct * 3}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">KB articles published from tickets</div>
            <div className="mt-1 text-xs text-muted">the knowledge loop, quantified</div>
          </div>
          <div className="text-3xl font-semibold">12</div>
        </div>
      </div>
    </div>
  );
}
