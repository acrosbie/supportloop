import Link from "next/link";
import { Building2 } from "lucide-react";
import { getAuth, NO_ORG } from "@/lib/auth";
import { listAccounts } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { planTone } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const me = await getAuth();
  const accounts = await listAccounts(me?.orgId ?? NO_ORG);
  const totalPeople = accounts.reduce((s, a) => s + a.customerCount, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-1 text-muted">
          {accounts.length} accounts · {totalPeople} people. Open an account to see its people and tickets.
        </p>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Building2}
          title="No accounts yet"
          description="Apply 0007_customers.sql and run npm run seed to populate customers + accounts."
        />
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {accounts.map((a) => (
            <Link
              key={a.id}
              href={`/agent/account/${a.id}`}
              className="rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{a.name}</span>
                <Badge tone={planTone(a.plan)}>{a.plan}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span>
                  {a.customerCount} {a.customerCount === 1 ? "person" : "people"}
                </span>
                <span>{a.ticketCount} tickets</span>
                {a.openCount > 0 && <span className="font-medium text-warning">{a.openCount} open</span>}
                <span className="capitalize">· {a.health.replace("_", " ")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
