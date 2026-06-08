import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuth, NO_ORG } from "@/lib/auth";
import { getAccountProfile } from "@/lib/data";
import TicketList from "@/components/agent/TicketList";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { planTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

export default async function AccountPage({ params }: { params: { id: string } }) {
  const me = await getAuth();
  const profile = await getAccountProfile(me?.orgId ?? NO_ORG, params.id);
  if (!profile) notFound();
  const { account, customers, tickets } = profile;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/agent/customers" className="text-sm text-accent-strong hover:underline">
        ← Customers
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{account.name}</h1>
          <p className="mt-1 text-sm capitalize text-muted">
            {account.status} · {account.health.replace("_", " ")}
            {account.since && ` · customer since ${new Date(account.since).getFullYear()}`}
          </p>
        </div>
        <Badge tone={planTone(account.plan)}>{account.plan}</Badge>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="MRR" value={`$${account.mrr.toLocaleString()}/mo`} />
        <Stat label="Seats" value={String(account.seats)} />
        <Stat label="People" value={String(customers.length)} />
        <Stat label="Tickets" value={String(tickets.length)} />
      </div>

      <h2 className="mt-8 text-sm font-medium">People ({customers.length})</h2>
      {customers.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No people on this account.</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/agent/customer/${c.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong"
            >
              <Avatar name={c.name} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{c.name}</div>
                <div className="truncate text-xs text-muted">{c.title || c.email}</div>
              </div>
              <span className="shrink-0 text-xs text-muted">{c.ticketCount} tickets</span>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-sm font-medium">Tickets ({tickets.length})</h2>
      <div className="mt-3">
        <TicketList tickets={tickets} />
      </div>
    </div>
  );
}
