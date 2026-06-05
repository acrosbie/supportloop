import { redirect } from "next/navigation";
import { Ticket as TicketIcon } from "lucide-react";
import { getAuth } from "@/lib/auth";
import { getMyTickets } from "@/lib/data";
import { StatusPill } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function MyTickets() {
  const auth = await getAuth();
  if (!auth) redirect("/login?next=/user/tickets");
  const tickets = await getMyTickets(auth.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">My tickets</h1>
      <p className="mt-1 text-muted">Tickets you've opened with Orbit support.</p>

      {tickets.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={TicketIcon}
          title="No tickets yet"
          description="When the assistant can't answer from the help center and you open a ticket, it shows up here."
        />
      ) : (
        <ul className="mt-6 space-y-2">
          {tickets.map((t) => (
            <li key={t.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{t.subject}</div>
                  <div className="mt-1 text-xs text-muted">
                    Opened {new Date(t.created_at).toLocaleDateString()} · {t.channel}
                  </div>
                </div>
                <StatusPill status={t.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
