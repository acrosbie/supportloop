"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Triage {
  intent: string;
  urgency: string;
  queue: string;
  sentiment: string;
}

export default function TriagePanel({ ticketId }: { ticketId: string }) {
  const [triage, setTriage] = useState<Triage | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/triage", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ticketId }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Triage failed");
        if (!cancelled) setTriage(j);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Triage failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-accent-strong" />
        AI triage
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        {(["intent", "urgency", "queue", "sentiment"] as const).map((k) => (
          <div key={k}>
            <div className="capitalize text-muted">{k}</div>
            {loading ? (
              <Skeleton className="mt-1 h-4 w-16" />
            ) : (
              <div className="font-medium capitalize">{triage ? triage[k] : "—"}</div>
            )}
          </div>
        ))}
      </div>
      {err && <div className="mt-2 text-xs text-danger">{err}</div>}
    </div>
  );
}
