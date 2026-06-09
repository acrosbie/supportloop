import { Timer, CheckCircle2, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const pct = (x: number | null) => (x == null ? "—" : `${Math.round(x * 100)}%`);

function Tile({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tone)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

export default function SlaSummary({
  firstResponseRate,
  resolutionRate,
  breachedOpen,
}: {
  firstResponseRate: number | null;
  resolutionRate: number | null;
  breachedOpen: number;
}) {
  return (
    <div>
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Service levels</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Tile icon={Timer} label="First-response SLA met" value={pct(firstResponseRate)} tone="bg-success-soft text-success" />
        <Tile icon={CheckCircle2} label="Resolution SLA met" value={pct(resolutionRate)} tone="bg-accent-soft text-accent-strong" />
        <Tile
          icon={AlertTriangle}
          label="Breaching now (open)"
          value={String(breachedOpen)}
          tone={breachedOpen > 0 ? "bg-danger-soft text-danger" : "bg-surface-2 text-muted"}
        />
      </div>
    </div>
  );
}
