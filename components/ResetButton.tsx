"use client";

import { useState } from "react";

/**
 * Resets the shared demo database back to the seeded baseline. Real but
 * reversible — this is how the shared public demo stays clean between visitors.
 */
export default function ResetButton({ className = "" }: { className?: string }) {
  const [resetting, setResetting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function reset() {
    const ok = window.confirm(
      "Reset all demo data back to the seeded state? This wipes any tickets, answers, and KB drafts created during the demo."
    );
    if (!ok) return;
    setResetting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Reset failed");
      setStatus("Demo data reset.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetting(false);
      setTimeout(() => setStatus(null), 4000);
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {status && <span className="text-xs text-muted">{status}</span>}
      <button
        onClick={reset}
        disabled={resetting}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-surface-2 disabled:opacity-60"
      >
        {resetting ? "Resetting…" : "Reset demo data"}
      </button>
    </div>
  );
}
