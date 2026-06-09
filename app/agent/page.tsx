import Link from "next/link";
import { Inbox } from "lucide-react";
import { getAuth, NO_ORG } from "@/lib/auth";
import { getQueue, getQueueCounts, getAgents } from "@/lib/data";
import type { Ticket } from "@/lib/types";
import QueueControls from "@/components/agent/QueueControls";
import { Badge, PriorityPill, StatusPill } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/utils";
import { activeSla, formatDuration } from "@/lib/sla";

export const dynamic = "force-dynamic";

function SlaCell({ t }: { t: Ticket }) {
  if (t.status === "resolved" || t.status === "deflected") return <span className="text-xs text-muted">—</span>;
  const sla = activeSla(t);
  if (sla.state === "breached") return <Badge tone="danger">Overdue {formatDuration(sla.ms)}</Badge>;
  if (sla.state === "warning") return <Badge tone="warning">Due {formatDuration(sla.ms)}</Badge>;
  return <span className="text-xs text-muted">On track · {formatDuration(sla.ms)}</span>;
}

export default async function AgentInbox({
  searchParams,
}: {
  searchParams: { view?: string; q?: string; priority?: string };
}) {
  const me = await getAuth();
  const meId = me?.id ?? "";
  const orgId = me?.orgId ?? NO_ORG;
  const view = searchParams.view || "my-open";
  const q = searchParams.q || "";

  const [tickets, counts, agents] = await Promise.all([
    getQueue(orgId, { view, q, priority: searchParams.priority }, meId),
    getQueueCounts(orgId, meId),
    getAgents(orgId),
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
                <th className="w-0" />
                <th className="px-3 py-2 font-medium">Subject</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">Priority</th>
                <th className="hidden px-3 py-2 font-medium lg:table-cell">Assignee</th>
                <th className="hidden px-3 py-2 font-medium lg:table-cell">SLA</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="hidden px-3 py-2 pr-6 font-medium sm:table-cell">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((t) => (
                <tr key={t.id} className="align-top hover:bg-surface-2">
                  <td className="w-0 py-3 pl-6 pr-2">
                    <Avatar name={t.requester_email || "anonymous"} />
                  </td>
                  <td className="max-w-md py-3 pr-3">
                    <Link href={`/agent/ticket/${t.id}`} className="block">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{t.subject}</span>
                        {t.is_hero && <Badge tone="accent">demo</Badge>}
                      </span>
                      <span className="mt-0.5 line-clamp-1 text-xs text-muted">{t.body}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                        <ChannelIcon channel={t.channel} className="h-3 w-3" />
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
                  <td className="hidden px-3 py-3 md:table-cell">
                    <PriorityPill priority={t.priority} />
                  </td>
                  <td className="hidden px-3 py-3 lg:table-cell">
                    {t.assignee_id ? (
                      <span className="flex items-center gap-1.5">
                        <Avatar name={agentName.get(t.assignee_id) || "A"} className="h-6 w-6 text-[9px]" />
                        <span className="hidden text-xs lg:inline">{agentName.get(t.assignee_id)}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="hidden px-3 py-3 lg:table-cell">
                    <SlaCell t={t} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={t.status} />
                  </td>
                  <td className="hidden px-3 py-3 pr-6 text-xs text-muted sm:table-cell">{timeAgo(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
