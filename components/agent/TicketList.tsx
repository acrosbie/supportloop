import Link from "next/link";
import { StatusPill, PriorityPill } from "@/components/ui/badge";

interface Row {
  id: string;
  subject: string;
  status: string;
  intent: string | null;
  priority: string;
  csat: number | null;
  created_at: string;
}

export default function TicketList({ tickets }: { tickets: Row[] }) {
  if (!tickets.length)
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">No tickets yet.</p>
    );
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {tickets.map((t) => (
            <tr key={t.id} className="hover:bg-surface-2">
              <td className="py-2.5 pl-4 pr-3">
                <Link href={`/agent/ticket/${t.id}`} className="block">
                  <span className="font-medium">{t.subject}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {t.intent || "untriaged"} · {new Date(t.created_at).toLocaleDateString()}
                    {t.csat != null && ` · CSAT ${t.csat}`}
                  </span>
                </Link>
              </td>
              <td className="hidden px-3 py-2.5 sm:table-cell">
                <PriorityPill priority={t.priority} />
              </td>
              <td className="px-3 py-2.5 pr-4 text-right">
                <StatusPill status={t.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
