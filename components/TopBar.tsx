"use client";

import { useEffect, useState } from "react";
import type { Persona } from "@/lib/types";

const PERSONAS: { id: Persona; label: string }[] = [
  { id: "customer", label: "Customer" },
  { id: "agent", label: "Agent" },
  { id: "ops", label: "Ops" },
];

export default function TopBar() {
  const [persona, setPersona] = useState<Persona>("customer");
  const [resetting, setResetting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("supportloop-persona") as Persona | null;
    if (saved) setPersona(saved);
  }, []);

  function choose(p: Persona) {
    setPersona(p);
    window.localStorage.setItem("supportloop-persona", p);
  }

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
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-muted sm:inline">Viewing as</span>
        <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => choose(p.id)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                persona === p.id
                  ? "bg-surface font-medium text-accent-strong shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {status && <span className="text-xs text-muted">{status}</span>}
        <button
          onClick={reset}
          disabled={resetting}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-surface-2 disabled:opacity-60"
        >
          {resetting ? "Resetting…" : "Reset demo data"}
        </button>
      </div>
    </header>
  );
}
