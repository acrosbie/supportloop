"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface Similar {
  id: string;
  subject: string;
  intent: string | null;
}

export default function Copilot({ ticketId, similar }: { ticketId: string; similar: Similar[] }) {
  const [data, setData] = useState<{ summary: string; next_action: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  async function run() {
    setBusy(true);
    setErr(false);
    try {
      const r = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      setData({ summary: j.summary, next_action: j.next_action });
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
          <Sparkles className="h-3.5 w-3.5 text-accent-strong" /> Copilot
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={busy}>
          {busy ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {busy ? "Thinking…" : data ? "Refresh" : "Summarize & suggest"}
        </Button>
      </div>

      {err && <p className="mt-3 text-sm text-danger">Couldn&apos;t run the copilot right now.</p>}

      {data && (
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted">Summary</div>
            <p className="mt-0.5 text-foreground/90">{data.summary}</p>
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent-soft p-2.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-accent-strong">Suggested next action</div>
            <p className="mt-0.5 text-foreground/90">{data.next_action}</p>
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted">Similar resolved tickets</div>
          <ul className="mt-1.5 space-y-0.5">
            {similar.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/agent/ticket/${s.id}`}
                  className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1 truncate">{s.subject}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
