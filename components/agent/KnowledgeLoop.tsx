"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toaster";

interface ResolvedTicket {
  id: string;
  subject: string;
  intent: string | null;
}
interface Draft {
  id: string;
  title: string;
  body: string;
  category: string;
}

export default function KnowledgeLoop({ resolved, drafts }: { resolved: ResolvedTicket[]; drafts: Draft[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function generate(ticketId: string) {
    setBusy(`gen:${ticketId}`);
    try {
      const res = await fetch("/api/kb-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Generate failed");
      toast.success("Draft article generated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(null);
    }
  }

  async function publish(articleId: string) {
    setBusy(`pub:${articleId}`);
    try {
      const res = await fetch("/api/kb-publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Publish failed");
      toast.success("Published — now improving retrieval");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Source material */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Ready to document</h2>
        <ul className="mt-3 space-y-3">
          {resolved.map((t) => (
            <li key={t.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="text-sm font-medium">{t.subject}</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Resolved · {t.intent ?? "Untriaged"}</span>
                <Button variant="outline" size="sm" onClick={() => generate(t.id)} disabled={busy !== null}>
                  {busy === `gen:${t.id}` ? "Generating…" : "Generate article"}
                </Button>
              </div>
            </li>
          ))}
          {resolved.length === 0 && (
            <EmptyState icon={FileText} title="No resolved tickets yet" description="Resolve a ticket in the Inbox to document it here." />
          )}
        </ul>
      </div>

      {/* Draft review queue */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Draft review queue</h2>
        <ul className="mt-3 space-y-3">
          {drafts.map((d) => (
            <li key={d.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">{d.category}</span>
                <Badge tone="warning">Draft</Badge>
              </div>
              <div className="mt-2 text-sm font-medium">{d.title}</div>
              <p className="mt-1 line-clamp-3 text-xs text-muted">{d.body}</p>
              <div className="mt-3">
                <Button size="sm" onClick={() => publish(d.id)} disabled={busy !== null}>
                  {busy === `pub:${d.id}` ? "Publishing…" : "Publish"}
                </Button>
              </div>
            </li>
          ))}
          {drafts.length === 0 && (
            <EmptyState icon={FileText} title="No drafts waiting" description="Generate one from a resolved ticket." />
          )}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Publishing embeds the article so it immediately improves chatbot and agent-assist retrieval — closing the loop.
        </p>
      </div>
    </div>
  );
}
