import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicket, getTicketMessages, getAgents, getCannedResponses } from "@/lib/data";
import { getAuth } from "@/lib/auth";
import TriagePanel from "@/components/agent/TriagePanel";
import TicketProperties from "@/components/agent/TicketProperties";
import ReplyComposer from "@/components/agent/ReplyComposer";
import { Badge, PriorityPill, StatusPill } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TicketDetail({ params }: { params: { id: string } }) {
  const ticket = await getTicket(params.id);
  if (!ticket) notFound();
  const [messages, agents, canned, me] = await Promise.all([
    getTicketMessages(params.id),
    getAgents(),
    getCannedResponses(),
    getAuth(),
  ]);
  const resolved = ticket.status === "resolved" || ticket.status === "deflected";

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <Link href="/agent" className="text-sm text-accent-strong hover:underline">
        ← Inbox
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span>{ticket.requester_email || "anonymous"}</span>
            <span>·</span>
            <span>{ticket.channel}</span>
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
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">Conversation</div>
            <div className="mt-3 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={m.role === "customer" ? "" : "flex justify-end"}>
                  <div
                    className={
                      m.internal
                        ? "max-w-[90%] rounded-2xl border border-warning/40 bg-warning-soft p-3 text-sm"
                        : m.role === "customer"
                          ? "max-w-[90%] rounded-2xl rounded-tl-sm bg-surface-2 p-3 text-sm"
                          : "max-w-[90%] rounded-2xl rounded-tr-sm bg-accent-soft p-3 text-sm"
                    }
                  >
                    <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
                      {m.role}
                      {m.internal && <Badge tone="warning">Internal</Badge>}
                    </div>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  </div>
                </div>
              ))}
              {messages.length === 0 && <div className="text-sm text-muted">No messages yet.</div>}
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
