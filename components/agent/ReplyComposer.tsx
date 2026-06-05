"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface Canned {
  id: string;
  title: string;
  body: string;
}
interface Source {
  id: string;
  title: string;
}

export default function ReplyComposer({
  ticketId,
  canned,
  resolved,
}: {
  ticketId: string;
  canned: Canned[];
  resolved: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [showCanned, setShowCanned] = useState(false);

  async function aiDraft() {
    setDrafting(true);
    setSources([]);
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
      const meta = metaRaw ? JSON.parse(metaRaw) : { sources: [] };
      setSources(meta.sources || []);
      setInternal(false);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setText(acc);
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
      const r = await fetch("/api/ticket-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId, action, body: text, internal }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success(action === "send" ? (internal ? "Note added" : "Reply sent") : "Ticket resolved");
      setText("");
      if (action === "resolve" || action === "send_resolve") router.push("/agent");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5 text-xs">
          <button
            onClick={() => setInternal(false)}
            className={cn("rounded-md px-2.5 py-1", !internal ? "bg-surface font-medium text-foreground shadow-sm" : "text-muted")}
          >
            Public reply
          </button>
          <button
            onClick={() => setInternal(true)}
            className={cn("rounded-md px-2.5 py-1", internal ? "bg-warning-soft font-medium text-warning" : "text-muted")}
          >
            Internal note
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShowCanned((s) => !s)}>
              Macros <ChevronDown className="h-3 w-3" />
            </Button>
            {showCanned && (
              <div className="absolute right-0 z-10 mt-1 w-64 rounded-lg border border-border bg-surface p-1 shadow-lg">
                {canned.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setText((t) => (t ? t + "\n\n" + c.body : c.body));
                      setShowCanned(false);
                    }}
                    className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-surface-2"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={aiDraft} disabled={drafting || resolved}>
            <Sparkles className="h-4 w-4" />
            {drafting ? "Drafting…" : "AI draft"}
          </Button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        disabled={resolved}
        placeholder={internal ? "Internal note (not sent to the customer)…" : "Write a reply…"}
        className={cn(
          "mt-3 w-full resize-y rounded-lg border p-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent disabled:opacity-60",
          internal ? "border-warning/40 bg-warning-soft/30" : "border-border bg-surface-2"
        )}
      />

      {sources.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {sources.map((s) => (
            <span key={s.id} className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] text-accent-strong">
              {s.title}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => act("send")} disabled={resolved || !text.trim() || working !== null}>
          {working === "send" ? "Sending…" : internal ? "Add note" : "Send reply"}
        </Button>
        {!internal && (
          <Button variant="outline" size="sm" onClick={() => act("send_resolve")} disabled={resolved || !text.trim() || working !== null}>
            Send & resolve
          </Button>
        )}
        {!resolved && (
          <Button variant="ghost" size="sm" onClick={() => act("resolve")} disabled={working !== null}>
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}
