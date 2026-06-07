"use client";

import { useState } from "react";
import { Bot, Wrench, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";

interface Step {
  tool: string;
  output: unknown;
}
interface Proposed {
  tool: string;
  input: { amount?: number; invoice_id?: string; reason?: string };
}

export default function AgentActions({ ticketId }: { ticketId: string }) {
  const [busy, setBusy] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [data, setData] = useState<{ message: string; steps: Step[]; proposed: Proposed | null } | null>(null);

  async function run() {
    setBusy(true);
    setApproved(false);
    try {
      const r = await fetch("/api/agent-actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      setData({ message: j.message, steps: j.steps, proposed: j.proposed });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    if (!data?.proposed) return;
    setApproving(true);
    try {
      const r = await fetch("/api/agent-approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId, action: data.proposed }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      setApproved(true);
      toast.success("Refund issued + reply posted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
          <Bot className="h-3.5 w-3.5 text-accent-strong" /> Agent actions
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={busy}>
          {busy ? <Spinner className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
          {busy ? "Investigating…" : data ? "Re-run" : "Investigate"}
        </Button>
      </div>

      {data && (
        <div className="mt-3 space-y-3 text-sm">
          {data.steps.length > 0 && (
            <div className="space-y-1.5">
              {data.steps.map((s, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Wrench className="h-3 w-3 text-muted" /> {s.tool}
                  </div>
                  <div className="mt-0.5 break-all font-mono text-[11px] text-muted">{JSON.stringify(s.output)}</div>
                </div>
              ))}
            </div>
          )}

          {data.message && <p className="text-foreground/90">{data.message}</p>}

          {data.proposed && !approved && (
            <div className="rounded-lg border border-warning/40 bg-warning-soft p-2.5">
              <div className="text-xs font-medium text-warning">Proposed action — needs your approval</div>
              <div className="mt-1 text-xs text-foreground/80">
                Refund ${Number(data.proposed.input.amount ?? 0).toFixed(2)} · {data.proposed.input.invoice_id}
              </div>
              {data.proposed.input.reason && (
                <div className="mt-0.5 text-xs text-muted">{data.proposed.input.reason}</div>
              )}
              <Button size="sm" className="mt-2" onClick={approve} disabled={approving}>
                {approving ? "Issuing…" : "Approve refund"}
              </Button>
            </div>
          )}

          {approved && (
            <div className="flex items-center gap-1.5 text-xs text-success">
              <Check className="h-3.5 w-3.5" /> Refund issued + reply posted to the customer.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
