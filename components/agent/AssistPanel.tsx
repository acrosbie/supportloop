"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";

interface Source {
  id: string;
  title: string;
  similarity: number;
}
interface Triage {
  intent: string;
  urgency: string;
  queue: string;
  sentiment: string;
}

export default function AssistPanel({ ticketId, status }: { ticketId: string; status: string }) {
  const router = useRouter();
  const [triage, setTriage] = useState<Triage | null>(null);
  const [triageErr, setTriageErr] = useState<string | null>(null);
  const [triaging, setTriaging] = useState(true);

  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [grounded, setGrounded] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const [working, setWorking] = useState<string | null>(null);
  const resolved = status === "resolved";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTriaging(true);
      setTriageErr(null);
      try {
        const res = await fetch("/api/triage", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ticketId }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Triage failed");
        if (!cancelled) setTriage(j);
      } catch (e) {
        if (!cancelled) setTriageErr(e instanceof Error ? e.message : "Triage failed");
      } finally {
        if (!cancelled) setTriaging(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  async function generateDraft() {
    setDrafting(true);
    setDraft("");
    setSources([]);
    setGrounded(null);
    setConfidence(null);
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Draft failed");
      }
      const metaRaw = res.headers.get("x-grounding");
      const meta = metaRaw ? JSON.parse(metaRaw) : { grounded: false, sources: [], topSimilarity: 0 };
      setSources(meta.sources || []);
      setGrounded(meta.grounded);
      setConfidence(meta.topSimilarity);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setDraft(acc);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Draft failed");
    } finally {
      setDrafting(false);
    }
  }

  async function act(action: string) {
    setWorking(action);
    try {
      const res = await fetch("/api/ticket-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId, action, body: draft }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Action failed");
      toast.success(action === "send" ? "Reply sent" : "Ticket resolved");
      if (action === "resolve" || action === "send_resolve") {
        router.push("/agent");
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-accent-strong" />
          AI Assist
        </div>
        {resolved && <Badge tone="success">Resolved</Badge>}
      </div>

      {/* Triage */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["intent", "urgency", "queue", "sentiment"] as const).map((k) => (
          <div key={k} className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="text-xs capitalize text-muted">{k}</div>
            {triaging ? (
              <Skeleton className="mt-1 h-4 w-16" />
            ) : (
              <div className="text-sm font-medium capitalize">{triage ? triage[k] : "—"}</div>
            )}
          </div>
        ))}
      </div>
      {triageErr && <div className="mt-2 text-xs text-danger">Triage: {triageErr}</div>}

      {/* Draft */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted">Suggested reply (grounded in KB)</div>
          <Button variant="outline" size="sm" onClick={generateDraft} disabled={drafting || resolved}>
            {drafting ? "Drafting…" : draft ? "Regenerate" : "Generate draft"}
          </Button>
        </div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Click “Generate draft” to produce a grounded reply you can edit before sending."
          rows={8}
          disabled={resolved}
          className="mt-2 w-full resize-y rounded-lg border border-border bg-surface-2 p-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent disabled:opacity-60"
        />

        {grounded !== null && (
          <div className="mt-2">
            {grounded && sources.length > 0 ? (
              <div>
                <div className="mb-1 text-[11px] text-muted">
                  Grounded in {sources.length} article{sources.length === 1 ? "" : "s"} · top match {confidence?.toFixed(2)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {sources.map((s) => (
                    <Link
                      key={s.id}
                      href={`/user/article/${s.id}`}
                      target="_blank"
                      className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] text-accent-strong hover:border-accent"
                    >
                      {s.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-warning">
                No confident KB match (best {confidence?.toFixed(2)}) — draft flags this for manual handling.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => act("send")} disabled={resolved || !draft.trim() || working !== null}>
          {working === "send" ? "Sending…" : "Send reply"}
        </Button>
        <Button size="sm" onClick={() => act("send_resolve")} disabled={resolved || !draft.trim() || working !== null}>
          {working === "send_resolve" ? "Working…" : "Send & resolve"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => act("resolve")} disabled={resolved || working !== null}>
          {working === "resolve" ? "Resolving…" : "Resolve only"}
        </Button>
      </div>
    </div>
  );
}
