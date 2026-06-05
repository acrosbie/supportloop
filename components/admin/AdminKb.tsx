"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

interface Article {
  id: string;
  title: string;
  body: string;
  category: string;
  status: string;
}

export default function AdminKb({ articles }: { articles: Article[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body: "", category: "" });
  const [busy, setBusy] = useState<string | null>(null);

  async function action(id: string, act: string, fields?: Record<string, unknown>) {
    setBusy(id + act);
    try {
      const r = await fetch("/api/admin/kb", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: act, id, fields }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success(act === "delete" ? "Deleted" : "Saved");
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      {articles.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-surface p-4">
          {editing === a.id ? (
            <div className="space-y-2">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-accent"
              />
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={5}
                className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-accent"
              />
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => action(a.id, "update", form)} disabled={busy !== null}>
                  {busy === a.id + "update" ? "Saving…" : "Save"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.title}</div>
                  <div className="mt-0.5 text-xs text-muted">{a.category}</div>
                </div>
                <StatusPill status={a.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(a.id);
                    setForm({ title: a.title, body: a.body, category: a.category });
                  }}
                >
                  Edit
                </Button>
                {a.status === "published" ? (
                  <Button variant="ghost" size="sm" onClick={() => action(a.id, "unpublish")} disabled={busy !== null}>
                    Unpublish
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => action(a.id, "publish")} disabled={busy !== null}>
                    Publish
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("Delete this article permanently?")) action(a.id, "delete");
                  }}
                  disabled={busy !== null}
                >
                  Delete
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
