"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

interface Profile {
  id: string;
  role: string;
  display_name: string | null;
  group_id: string | null;
  group_role: string | null;
}
interface Group {
  id: string;
  name: string;
}

const selectClass =
  "rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-accent disabled:opacity-50";

export default function AdminTeam({ profiles, groups, meId }: { profiles: Profile[]; groups: Group[]; meId: string }) {
  const router = useRouter();
  const [newGroup, setNewGroup] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: Record<string, unknown>, okMsg: string) {
    setBusy(true);
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success(okMsg);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const setRole = (userId: string, role: string) => post("/api/admin/set-role", { userId, role }, "Role updated");
  const assign = (userId: string, groupId: string | null, groupRole: string | null) =>
    post("/api/admin/assign-group", { userId, groupId, groupRole }, "Group updated");

  return (
    <div className="space-y-4">
      {/* Groups */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="text-sm font-medium">Agent groups</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <span key={g.id} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs">
              {g.name}
            </span>
          ))}
          {groups.length === 0 && <span className="text-xs text-muted">No groups yet.</span>}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            placeholder="New group name"
            className="field"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !newGroup.trim()}
            onClick={() => {
              post("/api/admin/groups", { name: newGroup.trim() }, "Group created");
              setNewGroup("");
            }}
          >
            Add group
          </Button>
        </div>
      </div>

      {/* Users */}
      <div className="rounded-xl border border-border bg-surface">
        {profiles.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0">
            <div className="flex items-center gap-2.5">
              <Avatar name={p.display_name || "User"} />
              <div className="text-sm font-medium">
                {p.display_name || "User"}
                {p.id === meId && <span className="ml-2 text-xs text-muted">(you)</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {p.role === "agent" && (
                <>
                  <select
                    value={p.group_id ?? ""}
                    onChange={(e) => assign(p.id, e.target.value || null, e.target.value ? p.group_role || "member" : null)}
                    className={selectClass}
                    aria-label="Group"
                  >
                    <option value="">No group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={p.group_role ?? "member"}
                    onChange={(e) => assign(p.id, p.group_id, e.target.value)}
                    disabled={!p.group_id}
                    className={selectClass}
                    aria-label="Group role"
                  >
                    <option value="member">member</option>
                    <option value="admin">group admin</option>
                  </select>
                </>
              )}
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

      {/* Permission reference */}
      <div className="rounded-xl border border-border bg-surface-2 p-4 text-xs text-muted">
        <div className="font-medium text-foreground">Who can do what</div>
        <ul className="mt-2 space-y-1">
          <li>· <span className="font-medium text-foreground/80">Org admin</span> — everything, incl. workspace settings, team &amp; roles.</li>
          <li>· <span className="font-medium text-foreground/80">Group admin</span> — publish/delete KB, view ops, manage workflows &amp; custom fields.</li>
          <li>· <span className="font-medium text-foreground/80">Group member</span> — work tickets &amp; draft KB (no publish, no ops).</li>
          <li>· <span className="font-medium text-foreground/80">Customer</span> — view the help center.</li>
        </ul>
        <p className="mt-2">Role &amp; group changes apply on the user&apos;s next sign-in.</p>
      </div>
    </div>
  );
}
