"use client";

import { useState, type ReactNode } from "react";
import { ShieldCheck, Bot, Star, Inbox, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import VolumeChart from "./VolumeChart";
import CountUp from "@/components/CountUp";
import { cn } from "@/lib/utils";

interface DeflectionStats {
  deflected: number;
  escalated: number;
  reverted: number;
  conversations: number;
  rate: number | null;
  naiveRate: number | null;
}
interface MetricSet {
  total: number;
  deflection: DeflectionStats;
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

export default function DashboardView({ all, today, volume, topIntents, kbFromTickets }: Props) {
  const [scope, setScope] = useState<"all" | "today">("all");
  const m = scope === "all" ? all : today;

  const d = m.deflection;
  const cards: { label: string; value: ReactNode; sub: string; icon: LucideIcon; tone: string }[] = [
    {
      label: "Deflection rate",
      value: d.rate === null ? "—" : <CountUp value={Math.round(d.rate * 100)} suffix="%" />,
      sub: d.conversations === 0 ? "no conversations yet" : `${d.deflected} of ${d.conversations} conversations`,
      icon: ShieldCheck,
      tone: "bg-success-soft text-success",
    },
    { label: "Automation rate", value: <CountUp value={Math.round(m.automationRate * 100)} suffix="%" />, sub: "AI-assisted resolutions", icon: Bot, tone: "bg-accent-soft text-accent-strong" },
    { label: "Avg CSAT", value: m.avgCsat != null ? <CountUp value={m.avgCsat} decimals={1} /> : "—", sub: "of 5", icon: Star, tone: "bg-warning-soft text-warning" },
    { label: scope === "all" ? "Tickets (all time)" : "Tickets today", value: <CountUp value={m.total} />, sub: "escalations only, excludes deflected", icon: Inbox, tone: "bg-surface-2 text-muted" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ops Dashboard</h1>
          <p className="mt-1 text-muted">Live from your tickets and events — does the AI move a metric?</p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
          <button
            onClick={() => setScope("all")}
            className={cn("rounded-md px-2.5 py-1", scope === "all" ? "bg-accent font-medium text-accent-fg" : "text-muted")}
          >
            All time
          </button>
          <button
            onClick={() => setScope("today")}
            className={cn("rounded-md px-2.5 py-1", scope === "today" ? "bg-accent font-medium text-accent-fg" : "text-muted")}
          >
            Today
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:border-border-strong hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{c.label}</span>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", c.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight">{c.value}</div>
              <div className="mt-1 text-xs text-muted">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* The denominator is the whole argument, so it is stated on the page
          rather than buried in a tooltip. */}
      <div className="mt-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-medium">How deflection is counted</div>
          <div className="text-xs text-muted">
            {d.deflected} deflected + {d.escalated} escalated
            {d.reverted > 0 && <> − {d.reverted} returned</>} = {d.conversations} conversations
          </div>
        </div>
        <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-success transition-all duration-500"
            style={{ width: `${d.conversations ? (d.deflected / d.conversations) * 100 : 0}%` }}
          />
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${d.conversations ? (d.escalated / d.conversations) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" /> Deflected, no human involved
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" /> Escalated to a ticket
          </span>
        </div>
        {d.reverted > 0 && d.naiveRate !== null && d.rate !== null && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3">
            <div>
              <div className="text-xs text-muted">Reported</div>
              <div className="text-lg font-semibold tabular-nums text-success">{Math.round(d.rate * 100)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted">Without the return window</div>
              <div className="text-lg font-semibold tabular-nums text-muted line-through decoration-danger/70">
                {Math.round(d.naiveRate * 100)}%
              </div>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-muted">
              <span className="font-medium text-foreground/80">{d.reverted}</span>{" "}
              {d.reverted === 1 ? "conversation" : "conversations"} got a confident answer and opened a ticket anyway
              within 4 hours. Those were delays, not deflections, so they are not counted as wins.
            </p>
          </div>
        )}

        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted">
          Counted over <span className="font-medium text-foreground/80">conversations</span>, not tickets. A deflected
          question never becomes a ticket, so dividing deflections by ticket count divides by a denominator that
          excludes most of its own numerator: publish a good article and the rate climbs twice, once because more
          questions deflect and again because fewer tickets open. A conversation that deflected and then came back is
          one escalation, not a win plus a loss, so the pair is collapsed rather than double-counted.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Ticket volume</div>
            <div className="text-xs text-muted">escalations · last 14 days</div>
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
                  <span className="text-muted">
                    {it.count} · {it.pct}%
                  </span>
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

      <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-medium">KB articles published from tickets</div>
            <div className="mt-0.5 text-xs text-muted">the knowledge loop, quantified — grows as you publish</div>
          </div>
        </div>
        <div className="text-3xl font-semibold">{kbFromTickets}</div>
      </div>
    </div>
  );
}
