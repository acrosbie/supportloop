import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuth, NO_ORG } from "@/lib/auth";
import { getCustomerProfile } from "@/lib/data";
import TicketList from "@/components/agent/TicketList";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { planTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }: { params: { id: string } }) {
  const me = await getAuth();
  const profile = await getCustomerProfile(me?.orgId ?? NO_ORG, params.id);
  if (!profile) notFound();
  const { customer, account, tickets, avgCsat } = profile;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href={account ? `/agent/account/${account.id}` : "/agent/customers"}
        className="text-sm text-accent-strong hover:underline"
      >
        ← {account ? account.name : "Customers"}
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <Avatar name={customer.name} className="h-12 w-12 text-base" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="truncate text-sm text-muted">
            {[customer.title, account?.name].filter(Boolean).join(" · ") || customer.email}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{customer.email}</span>
        {account && <Badge tone={planTone(account.plan)}>{account.plan}</Badge>}
        <span>· {tickets.length} tickets</span>
        <span>· avg CSAT {avgCsat != null ? avgCsat.toFixed(1) : "—"}</span>
      </div>

      <h2 className="mt-8 text-sm font-medium">Tickets ({tickets.length})</h2>
      <div className="mt-3">
        <TicketList tickets={tickets} />
      </div>
    </div>
  );
}
