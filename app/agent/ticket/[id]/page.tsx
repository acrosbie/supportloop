import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicket, getTicketMessages } from "@/lib/data";
import AssistPanel from "@/components/agent/AssistPanel";

export const dynamic = "force-dynamic";

export default async function TicketDetail({ params }: { params: { id: string } }) {
  const ticket = await getTicket(params.id);
  if (!ticket) notFound();
  const messages = await getTicketMessages(params.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <Link href="/agent" className="text-sm text-accent-strong hover:underline">
        ← Inbox
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <div className="mt-1 text-xs text-muted">
            {ticket.channel} · opened {new Date(ticket.created_at).toLocaleString()} ·{" "}
            <span className="capitalize">{ticket.status}</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted">
          {ticket.urgency ?? "—"} urgency
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Conversation */}
        <div>
          <div className="text-sm font-medium">Conversation</div>
          <div className="mt-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "customer" ? "" : "flex justify-end"}>
                <div
                  className={
                    m.role === "customer"
                      ? "max-w-[90%] rounded-2xl rounded-tl-sm bg-surface-2 p-3 text-sm"
                      : "max-w-[90%] rounded-2xl rounded-tr-sm bg-accent-soft p-3 text-sm"
                  }
                >
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">{m.role}</div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              </div>
            ))}
            {messages.length === 0 && <div className="text-sm text-muted">No messages yet.</div>}
          </div>
        </div>

        {/* AI Assist */}
        <AssistPanel ticketId={ticket.id} status={ticket.status} />
      </div>
    </div>
  );
}
