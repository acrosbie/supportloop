import Link from "next/link";
import { getInboxTickets } from "@/lib/data";

export const dynamic = "force-dynamic";

const urgencyDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

function ago(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default async function AgentInbox() {
  const tickets = await getInboxTickets();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <h1 className="text-lg font-semibold">Inbox</h1>
        <span className="text-sm text-muted">{tickets.length} open</span>
      </div>

      <ul className="divide-y divide-border">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link href={`/agent/ticket/${t.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-surface">
              <span className={`h-2 w-2 shrink-0 rounded-full ${urgencyDot[t.urgency ?? "low"]}`} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{t.subject}</span>
                  {t.is_hero && (
                    <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-strong">
                      demo
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {t.intent ?? "Untriaged"} · <span className="capitalize">{t.status}</span> · {t.channel}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted">{ago(t.created_at)}</span>
            </Link>
          </li>
        ))}
        {tickets.length === 0 && (
          <li className="px-6 py-12 text-center text-sm text-muted">
            No open tickets. Ask a question the help center can't answer (in the Customer view) to create one.
          </li>
        )}
      </ul>
    </div>
  );
}
