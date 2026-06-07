"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface Theme {
  name: string;
  thisWeek: number;
  lastWeek: number;
  trend: "new" | "up" | "down" | "flat";
}

const TREND: Record<Theme["trend"], { c: string; icon: LucideIcon; label: string }> = {
  // Rising ticket volume is a problem (red); falling is good (green).
  new: { c: "text-accent-strong", icon: Plus, label: "new" },
  up: { c: "text-danger", icon: TrendingUp, label: "rising" },
  down: { c: "text-success", icon: TrendingDown, label: "falling" },
  flat: { c: "text-muted", icon: Minus, label: "steady" },
};

export default function InsightsPanel({
  themes,
  thisWeekTotal,
  lastWeekTotal,
  resolvedThisWeek,
}: {
  themes: Theme[];
  thisWeekTotal: number;
  lastWeekTotal: number;
  resolvedThisWeek: number;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const max = themes[0]?.thisWeek || 1;
  const delta = thisWeekTotal - lastWeekTotal;

  async function summarize() {
    setBusy(true);
    try {
      const r = await fetch("/api/insights", { method: "POST" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      setSummary(j.summary);
    } catch {
      setSummary("Couldn't generate a summary right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Emerging themes</h2>
          <p className="mt-0.5 text-xs text-muted">
            {thisWeekTotal} tickets this week ({delta >= 0 ? "+" : ""}
            {delta} vs last) · {resolvedThisWeek} resolved
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={summarize} disabled={busy}>
          {busy ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {busy ? "Analyzing…" : "Summarize the week"}
        </Button>
      </div>

      {summary && (
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent-soft p-3 text-sm leading-relaxed text-foreground/90">
          {summary}
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {themes.map((t) => {
          const tr = TREND[t.trend];
          const Icon = tr.icon;
          return (
            <li key={t.name} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-sm sm:w-36">{t.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (t.thisWeek / max) * 100)}%` }} />
              </div>
              <span className="w-7 text-right text-sm tabular-nums">{t.thisWeek}</span>
              <span className={`flex w-16 shrink-0 items-center gap-1 text-xs ${tr.c}`}>
                <Icon className="h-3.5 w-3.5" />
                {tr.label}
              </span>
            </li>
          );
        })}
        {themes.length === 0 && <li className="text-sm text-muted">Not enough recent tickets to show themes.</li>}
      </ul>
    </div>
  );
}
