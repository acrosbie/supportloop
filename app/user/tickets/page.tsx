import Link from "next/link";
import { redirect } from "next/navigation";
import { Ticket as TicketIcon } from "lucide-react";
import { getAuth, NO_ORG } from "@/lib/auth";
import { getMyTickets } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ChannelIcon, channelLabel } from "@/components/ui/channel-icon";
import CsatRater from "@/components/customer/CsatRater";

export const dynamic = "force-dynamic";

export default async function MyTickets() {
  const auth = await getAuth();
  if (!auth) redirect("/login?next=/user/tickets");
  const tickets = await getMyTickets(auth.orgId ?? NO_ORG, auth.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My tickets</h1>
          <p className="mt-1 text-muted">Tickets you've opened with Orbit support.</p>
        </div>
        <Button asChild>
          <Link href="/user/new">Submit a request</Link>
        </Button>
      </div>

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
            <li key={t.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                <ChannelIcon channel={t.channel} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.subject}</div>
                <div className="mt-1 text-xs text-muted">
                  Opened {new Date(t.created_at).toLocaleDateString()} · {channelLabel(t.channel)}
                </div>
                {t.status === "resolved" && <CsatRater ticketId={t.id} initial={t.csat} />}
              </div>
              <StatusPill status={t.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
