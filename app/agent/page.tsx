import Link from "next/link";
import { Inbox } from "lucide-react";
import { getAuth } from "@/lib/auth";
import { getQueue, getQueueCounts, getAgents } from "@/lib/data";
import type { Ticket } from "@/lib/types";
import QueueControls from "@/components/agent/QueueControls";
import { Badge, PriorityPill, StatusPill } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

function ago(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function SlaCell({ t }: { t: Ticket }) {
  if (t.status === "resolved" || t.status === "deflected" || !t.sla_due_at)
    return <span className="text-xs text-muted">—</span>;
  const due = new Date(t.sla_due_at).getTime();
  const now = Date.now();
  if (now > due) return <Badge tone="danger">Overdue</Badge>;
  if (due - now < 4 * 3600_000) return <Badge tone="warning">Due soon</Badge>;
  return <span className="text-xs text-muted">On track</span>;
}

export default async function AgentInbox({
  searchParams,
}: {
  searchParams: { view?: string; q?: string; priority?: string };
}) {
  const me = await getAuth();
  const meId = me?.id ?? "";
  const view = searchParams.view || "my-open";
  const q = searchParams.q || "";

  const [tickets, counts, agents] = await Promise.all([
    getQueue({ view, q, priority: searchParams.priority }, meId),
    getQueueCounts(meId),
    getAgents(),
  ]);
  const agentName = new Map(agents.map((a) => [a.id, a.display_name || "Agent"]));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <h1 className="text-lg font-semibold">Inbox</h1>
        <span className="text-sm text-muted">{tickets.length} shown</span>
      </div>

      <QueueControls counts={counts} view={view} q={q} />

      {tickets.length === 0 ? (
        <div className="p-10">
          <EmptyState icon={Inbox} title="Nothing in this view" description="Try another view, or clear the search." />
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-6 py-2 font-medium">Subject</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Assignee</th>
                <th className="px-3 py-2 font-medium">SLA</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-surface-2">
                  <td className="px-6 py-3">
                    <Link href={`/agent/ticket/${t.id}`} className="block">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{t.subject}</span>
                        {t.is_hero && (
                          <span className="rounded bg-accent-soft px-1 text-[10px] font-medium text-accent-strong">demo</span>
                        )}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        <span>{t.requester_email || "anonymous"}</span>
                        <span>·</span>
                        <span>{t.intent || "untriaged"}</span>
                        {t.tags.map((tag) => (
                          <span key={tag} className="rounded bg-surface-2 px-1 text-[10px]">
                            {tag}
                          </span>
                        ))}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <PriorityPill priority={t.priority} />
                  </td>
                  <td className="px-3 py-3">
                    {t.assignee_id ? (
                      <span className="flex items-center gap-1.5">
                        <Avatar name={agentName.get(t.assignee_id) || "A"} className="h-6 w-6 text-[9px]" />
                        <span className="hidden text-xs lg:inline">{agentName.get(t.assignee_id)}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <SlaCell t={t} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={t.status} />
                  </td>
                  <td className="px-3 py-3 text-xs text-muted">{ago(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
