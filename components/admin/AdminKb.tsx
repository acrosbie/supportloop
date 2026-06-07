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
  const [showImport, setShowImport] = useState(false);
  const [md, setMd] = useState("");
  const [cat, setCat] = useState("");
  const [importBusy, setImportBusy] = useState(false);

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

  async function importKb() {
    if (!md.trim()) return;
    setImportBusy(true);
    try {
      const r = await fetch("/api/admin/kb-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markdown: md, category: cat }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Import failed");
      toast.success(`Imported ${j.count} article${j.count === 1 ? "" : "s"}`);
      setMd("");
      setCat("");
      setShowImport(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImportBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium">Import knowledge</div>
            <div className="text-xs text-muted">Paste Markdown — use “# Title” headings to import several articles at once.</div>
          </div>
          <Button variant={showImport ? "ghost" : "outline"} size="sm" onClick={() => setShowImport((s) => !s)}>
            {showImport ? "Close" : "Import"}
          </Button>
        </div>
        {showImport && (
          <div className="mt-3 space-y-2">
            <textarea
              value={md}
              onChange={(e) => setMd(e.target.value)}
              rows={8}
              placeholder={"# How do I reset my password?\n\nGo to Settings → Security and choose Reset…\n\n# Where are my invoices?\n\n…"}
              className="field font-mono text-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                placeholder="Category (optional)"
                className="field flex-1"
              />
              <Button size="sm" onClick={importKb} disabled={importBusy || !md.trim()}>
                {importBusy ? "Importing…" : "Import & publish"}
              </Button>
            </div>
            <p className="text-xs text-muted">Imported articles are embedded and published immediately, so the assistant can use them right away.</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
      {articles.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-surface p-4">
          {editing === a.id ? (
            <div className="space-y-2">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="field"
              />
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={5}
                className="field"
              />
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="field"
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
      {articles.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          No articles yet. Import or create your first article above.
        </p>
      )}
      </div>
    </div>
  );
}
