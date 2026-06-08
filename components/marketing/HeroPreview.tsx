// A live-looking, framed operator dashboard — dark, so it pops against the light
// hero. Pure CSS/divs (no screenshot), built from the real design tokens.
const BARS = [40, 52, 46, 60, 55, 68, 62, 78, 70, 86, 80, 92, 88, 100];

function Kpi({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-2.5">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-[10px] text-muted">{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

function Theme({ name, pct, trend }: { name: string; pct: number; trend: "up" | "down" | "new" }) {
  const color = trend === "up" ? "text-danger" : trend === "down" ? "text-success" : "text-accent-strong";
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="w-20 shrink-0 truncate text-[10px]">{name}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[9px] ${color}`}>{trend}</span>
    </div>
  );
}

export default function HeroPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-3xl"
        style={{ background: "radial-gradient(55% 55% at 55% 10%, rgb(var(--accent) / 0.35), transparent)" }}
      />
      <div data-theme="dark" className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-3 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-2 rounded bg-background px-2 py-0.5 text-[9px] text-muted">app.supportloop.com/ops</span>
        </div>
        <div className="bg-background p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Ops Dashboard</span>
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[9px] text-accent-strong">live</span>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <Kpi label="Deflection" value="91%" dot="bg-success" />
            <Kpi label="Automation" value="64%" dot="bg-accent" />
            <Kpi label="Avg CSAT" value="4.6" dot="bg-warning" />
            <Kpi label="Tickets" value="1,284" dot="bg-border-strong" />
          </div>
          <div className="mt-2.5 rounded-lg border border-border bg-surface p-2.5">
            <div className="text-[10px] text-muted">Ticket volume · 14 days</div>
            <div className="mt-2 flex h-14 items-end gap-1">
              {BARS.map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-accent/80" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-2.5 rounded-lg border border-border bg-surface p-2.5">
            <div className="text-[10px] text-muted">Emerging themes</div>
            <Theme name="Billing" pct={72} trend="up" />
            <Theme name="Audio &amp; Video" pct={48} trend="down" />
            <Theme name="SSO / Security" pct={30} trend="new" />
          </div>
        </div>
      </div>
    </div>
  );
}
