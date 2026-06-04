"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Generate failed");
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
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Source material */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Ready to document</h2>
        <ul className="mt-3 space-y-3">
          {resolved.map((t) => (
            <li key={t.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="text-sm font-medium">{t.subject}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted">Resolved · {t.intent ?? "Untriaged"}</span>
                <button
                  onClick={() => generate(t.id)}
                  disabled={busy !== null}
                  className="rounded-lg border border-border bg-surface px-3 py-1 text-xs text-foreground/80 hover:bg-surface-2 disabled:opacity-60"
                >
                  {busy === `gen:${t.id}` ? "Generating…" : "Generate article"}
                </button>
              </div>
            </li>
          ))}
          {resolved.length === 0 && (
            <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
              No resolved tickets yet. Resolve one in the Inbox to document it.
            </li>
          )}
        </ul>
      </div>

      {/* Draft review queue */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Draft review queue</h2>
        <ul className="mt-3 space-y-3">
          {drafts.map((d) => (
            <li key={d.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-foreground/70">{d.category}</span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                  Draft
                </span>
              </div>
              <div className="mt-2 text-sm font-medium">{d.title}</div>
              <p className="mt-1 line-clamp-3 text-xs text-muted">{d.body}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => publish(d.id)}
                  disabled={busy !== null}
                  className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-60"
                >
                  {busy === `pub:${d.id}` ? "Publishing…" : "Publish"}
                </button>
              </div>
            </li>
          ))}
          {drafts.length === 0 && (
            <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
              No drafts waiting. Generate one from a resolved ticket.
            </li>
          )}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Publishing embeds the article so it immediately improves chatbot and agent-assist retrieval — closing the loop.
        </p>
      </div>
    </div>
  );
}
