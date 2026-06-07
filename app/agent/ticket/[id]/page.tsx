import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicket, getTicketMessages, getAgents, getCannedResponses, getSimilarTickets } from "@/lib/data";
import { getAuth, NO_ORG } from "@/lib/auth";
import TriagePanel from "@/components/agent/TriagePanel";
import TicketProperties from "@/components/agent/TicketProperties";
import ReplyComposer from "@/components/agent/ReplyComposer";
import Copilot from "@/components/agent/Copilot";
import LiveChatRoom from "@/components/LiveChatRoom";
import { Badge, PriorityPill, StatusPill } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ChannelIcon, channelLabel } from "@/components/ui/channel-icon";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TicketDetail({ params }: { params: { id: string } }) {
  const me = await getAuth();
  const orgId = me?.orgId ?? NO_ORG;
  const ticket = await getTicket(orgId, params.id);
  if (!ticket) notFound();
  const [messages, agents, canned, similar] = await Promise.all([
    getTicketMessages(orgId, params.id),
    getAgents(orgId),
    getCannedResponses(orgId),
    getSimilarTickets(orgId, params.id),
  ]);
  const resolved = ticket.status === "resolved" || ticket.status === "deflected";
  const requester = ticket.requester_email || "anonymous";

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <Link href="/agent" className="text-sm text-accent-strong hover:underline">
        ← Inbox
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <ChannelIcon channel={ticket.channel} className="h-3 w-3" />
              {channelLabel(ticket.channel)}
            </span>
            <span>·</span>
            <span>opened {new Date(ticket.created_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PriorityPill priority={ticket.priority} />
          <StatusPill status={ticket.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Conversation + composer */}
        <div className="space-y-4 lg:col-span-2">
          {ticket.channel === "live" && !resolved && (
            <LiveChatRoom
              ticketId={ticket.id}
              role="agent"
              initial={messages.map((m) => ({
                role: m.role === "customer" ? ("customer" as const) : ("agent" as const),
                body: m.body,
                ts: new Date(m.created_at).getTime(),
              }))}
            />
          )}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">Conversation</div>
            <div className="mt-3 space-y-1">
              {messages.map((m) => {
                const isCustomer = m.role === "customer";
                const author = isCustomer ? requester : m.role === "ai" ? "Orbit Assistant" : me?.name || "Agent";
                return (
                  <div
                    key={m.id}
                    className={cn("flex gap-3 rounded-xl p-3", m.internal && "border border-warning/40 bg-warning-soft")}
                  >
                    <Avatar name={author} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="font-medium text-foreground">{author}</span>
                        <span className="capitalize text-muted">· {m.role}</span>
                        {m.internal && <Badge tone="warning">Internal note</Badge>}
                        <span className="text-muted">· {new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{m.body}</div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && <div className="p-3 text-sm text-muted">No messages yet.</div>}
            </div>
          </div>

          <ReplyComposer
            ticketId={ticket.id}
            canned={canned.map((c) => ({ id: c.id, title: c.title, body: c.body }))}
            resolved={resolved}
          />
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Requester */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <Avatar name={requester} className="h-10 w-10 text-sm" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{requester}</div>
                <div className="text-xs text-muted">Requester</div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Channel</span>
                <span className="flex items-center gap-1">
                  <ChannelIcon channel={ticket.channel} className="h-3 w-3" />
                  {channelLabel(ticket.channel)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Opened</span>
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              {ticket.first_response_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">First reply</span>
                  <span>{new Date(ticket.first_response_at).toLocaleDateString()}</span>
                </div>
              )}
              {ticket.sla_due_at && !resolved && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">SLA due</span>
                  <span>{new Date(ticket.sla_due_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <Copilot
            ticketId={ticket.id}
            similar={similar.map((s) => ({ id: s.id, subject: s.subject, intent: s.intent }))}
          />
          <TriagePanel ticketId={ticket.id} />
          <TicketProperties
            ticketId={ticket.id}
            initial={{
              priority: ticket.priority,
              status: ticket.status,
              assignee_id: ticket.assignee_id,
              queue: ticket.queue,
              tags: ticket.tags,
            }}
            agents={agents.map((a) => ({ id: a.id, name: a.display_name || "Agent" }))}
            meId={me?.id || ""}
          />
        </div>
      </div>
    </div>
  );
}
