import { Sparkles, Clock, DollarSign, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

interface Row {
  surface: string;
  model: string;
  latencyMs: number;
  costUsd: number | null;
  grounded: boolean | null;
  topSimilarity: number | null;
  created_at: string;
}

const shortModel = (m: string) => m.replace("claude-", "").replace(/-\d{8}$/, "");

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

export default function AiActivityView({
  rows,
  totalCalls,
  totalCost,
  avgLatency,
  groundedRate,
}: {
  rows: Row[];
  totalCalls: number;
  totalCost: number;
  avgLatency: number;
  groundedRate: number | null;
}) {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI activity</h1>
        <p className="mt-1 text-muted">Every model call — grounding decision, latency, tokens, and estimated cost.</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Sparkles} label="AI calls" value={String(totalCalls)} />
        <Stat icon={DollarSign} label="Est. spend" value={`$${totalCost.toFixed(4)}`} />
        <Stat icon={Clock} label="Avg latency" value={`${Math.round(avgLatency)} ms`} />
        <Stat icon={ShieldCheck} label="Grounded rate" value={groundedRate == null ? "—" : `${Math.round(groundedRate * 100)}%`} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-medium">Surface</th>
              <th className="hidden px-4 py-2 font-medium sm:table-cell">Model</th>
              <th className="px-4 py-2 font-medium">Grounding</th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">Latency</th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">Cost</th>
              <th className="px-4 py-2 pr-4 text-right font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5">
                  <Badge tone="accent">{r.surface}</Badge>
                </td>
                <td className="hidden px-4 py-2.5 font-mono text-xs text-muted sm:table-cell">{shortModel(r.model)}</td>
                <td className="px-4 py-2.5">
                  {r.grounded == null ? (
                    <span className="text-muted">—</span>
                  ) : r.grounded ? (
                    <span className="text-success">grounded · {r.topSimilarity?.toFixed(2)}</span>
                  ) : (
                    <span className="text-warning">escalated · {r.topSimilarity?.toFixed(2)}</span>
                  )}
                </td>
                <td className="hidden px-4 py-2.5 text-muted md:table-cell">{r.latencyMs} ms</td>
                <td className="hidden px-4 py-2.5 text-muted md:table-cell">
                  {r.costUsd == null ? "—" : `$${r.costUsd.toFixed(5)}`}
                </td>
                <td className="px-4 py-2.5 pr-4 text-right text-xs text-muted">{timeAgo(r.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  No AI activity yet — use the chatbot, run triage, or open the copilot to generate traces.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
