"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWS = [
  { key: "my-open", label: "My open" },
  { key: "unassigned", label: "Unassigned" },
  { key: "urgent", label: "Urgent" },
  { key: "open", label: "All open" },
  { key: "resolved", label: "Resolved" },
];

export default function QueueControls({
  counts,
  view,
  q,
}: {
  counts: Record<string, number>;
  view: string;
  q: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);

  function go(nextView: string, nextQ: string) {
    const p = new URLSearchParams();
    p.set("view", nextView);
    if (nextQ) p.set("q", nextQ);
    router.push(`/agent?${p.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-surface px-4 py-2.5 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex flex-wrap gap-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => go(v.key, search)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-sm transition-colors",
              view === v.key ? "bg-accent-soft font-medium text-accent-strong" : "text-muted hover:bg-surface-2 hover:text-foreground"
            )}
          >
            {v.label}
            <span className="ml-1.5 text-xs text-muted">{counts[v.key] ?? 0}</span>
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(view, search);
        }}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm md:w-64"
      >
        <Search className="h-4 w-4 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects…"
          className="w-full bg-transparent outline-none placeholder:text-muted"
        />
      </form>
    </div>
  );
}
