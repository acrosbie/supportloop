"use client";

import { useState } from "react";
import VolumeChart from "./VolumeChart";

interface MetricSet {
  total: number;
  deflectionRate: number;
  automationRate: number;
  avgCsat: number | null;
}
interface Props {
  all: MetricSet;
  today: MetricSet;
  volume: { day: string; tickets: number }[];
  topIntents: { name: string; count: number; pct: number }[];
  kbFromTickets: number;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function DashboardView({ all, today, volume, topIntents, kbFromTickets }: Props) {
  const [scope, setScope] = useState<"all" | "today">("all");
  const m = scope === "all" ? all : today;

  const cards = [
    { label: "Deflection rate", value: pct(m.deflectionRate), sub: "resolved without an agent" },
    { label: "Automation rate", value: pct(m.automationRate), sub: "AI-assisted resolutions" },
    { label: "Avg CSAT", value: m.avgCsat != null ? m.avgCsat.toFixed(1) : "—", sub: "of 5" },
    { label: scope === "all" ? "Tickets (all time)" : "Tickets today", value: String(m.total), sub: "across all channels" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ops Dashboard</h1>
          <p className="mt-1 text-muted">Live from your tickets and events — does the AI move a metric?</p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
          <button
            onClick={() => setScope("all")}
            className={`rounded-md px-2.5 py-1 ${scope === "all" ? "bg-accent font-medium text-accent-fg" : "text-muted"}`}
          >
            All time
          </button>
          <button
            onClick={() => setScope("today")}
            className={`rounded-md px-2.5 py-1 ${scope === "today" ? "bg-accent font-medium text-accent-fg" : "text-muted"}`}
          >
            Today
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-surface p-5">
            <div className="text-sm text-muted">{c.label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{c.value}</div>
            <div className="mt-1 text-xs text-muted">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Ticket volume</div>
            <div className="text-xs text-muted">last 14 days</div>
          </div>
          <div className="mt-3">
            <VolumeChart data={volume} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="text-sm font-medium">Top intents</div>
          <ul className="mt-4 space-y-3">
            {topIntents.map((it) => (
              <li key={it.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/80">{it.name}</span>
                  <span className="text-muted">{it.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, it.pct * 3)}%` }} />
                </div>
              </li>
            ))}
            {topIntents.length === 0 && <li className="text-xs text-muted">No triaged tickets yet.</li>}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">KB articles published from tickets</div>
            <div className="mt-1 text-xs text-muted">the knowledge loop, quantified — grows as you publish</div>
          </div>
          <div className="text-3xl font-semibold">{kbFromTickets}</div>
        </div>
      </div>
    </div>
  );
}
