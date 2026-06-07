"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

interface Settings {
  accent?: string;
  tagline?: string;
  threshold?: number;
}

export default function AdminSettings({ initial }: { initial: Settings }) {
  const [accent, setAccent] = useState(initial.accent || "#5e6ad2");
  const [tagline, setTagline] = useState(initial.tagline || "");
  const [threshold, setThreshold] = useState(initial.threshold ?? 0.6);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings: { accent, tagline, threshold } }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Brand accent</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              aria-label="Accent color"
              className="h-9 w-12 shrink-0 rounded border border-border bg-surface"
            />
            <input value={accent} onChange={(e) => setAccent(e.target.value)} className="field" />
          </div>
          <span className="mt-1 block text-xs text-muted">Re-skins your hosted help center + widget.</span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Help center tagline</span>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="How can we help?"
            className="field mt-1"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Answer confidence threshold · {threshold.toFixed(2)}</span>
        <input
          type="range"
          min={0.4}
          max={0.8}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
        <span className="mt-1 block text-xs text-muted">
          Higher = the assistant answers only when very confident (more escalations).
        </span>
      </label>
      <Button size="sm" onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
