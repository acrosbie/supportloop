"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface Agent {
  id: string;
  name: string;
}
interface Initial {
  priority: string;
  status: string;
  assignee_id: string | null;
  queue: string | null;
  tags: string[];
}

const SELECT = "w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-accent";
const QUEUES = ["Billing", "Technical", "Account", "Recordings", "Admin", "Unassigned"];

export default function TicketProperties({
  ticketId,
  initial,
  agents,
  meId,
}: {
  ticketId: string;
  initial: Initial;
  agents: Agent[];
  meId: string;
}) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");

  async function update(fields: Record<string, unknown>) {
    try {
      const r = await fetch("/api/ticket/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketId, fields }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Update failed");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div className="text-sm font-semibold">Properties</div>

      <label className="block">
        <span className="text-xs text-muted">Priority</span>
        <select className={SELECT} value={initial.priority} onChange={(e) => update({ priority: e.target.value })}>
          {["low", "normal", "high", "urgent"].map((p) => (
            <option key={p} value={p} className="capitalize">
              {p}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs text-muted">Status</span>
        <select className={SELECT} value={initial.status} onChange={(e) => update({ status: e.target.value })}>
          {["open", "assisted", "resolved"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="text-xs text-muted">Assignee</span>
        <div className="mt-0.5 flex gap-2">
          <select
            className={SELECT}
            value={initial.assignee_id || ""}
            onChange={(e) => update({ assignee_id: e.target.value || null })}
          >
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {initial.assignee_id !== meId && meId && (
            <button
              onClick={() => update({ assignee_id: meId })}
              className="shrink-0 rounded-lg border border-border px-2 text-xs text-muted hover:bg-surface-2 hover:text-foreground"
            >
              To me
            </button>
          )}
        </div>
      </div>

      <label className="block">
        <span className="text-xs text-muted">Queue</span>
        <select className={SELECT} value={initial.queue || "Unassigned"} onChange={(e) => update({ queue: e.target.value })}>
          {QUEUES.map((qn) => (
            <option key={qn} value={qn}>
              {qn}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="text-xs text-muted">Tags</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {initial.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs">
              {tag}
              <button onClick={() => update({ tags: initial.tags.filter((x) => x !== tag) })} className="text-muted hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && tagInput.trim()) {
              e.preventDefault();
              if (!initial.tags.includes(tagInput.trim())) update({ tags: [...initial.tags, tagInput.trim()] });
              setTagInput("");
            }
          }}
          placeholder="Add tag + Enter"
          className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
