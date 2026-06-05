"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";

interface Profile {
  id: string;
  role: string;
  display_name: string | null;
}

export default function AdminTeam({ profiles, meId }: { profiles: Profile[]; meId: string }) {
  const router = useRouter();

  async function setRole(userId: string, role: string) {
    try {
      const r = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success("Role updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      {profiles.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0">
          <div className="flex items-center gap-2.5">
            <Avatar name={p.display_name || "User"} />
            <div className="text-sm font-medium">
              {p.display_name || "User"}
              {p.id === meId && <span className="ml-2 text-xs text-muted">(you)</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={p.role === "admin" ? "accent" : p.role === "agent" ? "success" : "neutral"}>{p.role}</Badge>
            <select
              value={p.role}
              onChange={(e) => setRole(p.id, e.target.value)}
              disabled={p.id === meId}
              className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-accent disabled:opacity-50"
            >
              <option value="customer">customer</option>
              <option value="agent">agent</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>
      ))}
      {profiles.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted">No users yet.</div>}
    </div>
  );
}
