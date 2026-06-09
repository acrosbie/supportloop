import type { Ticket } from "@/lib/types";
import { firstResponseSla, nextResponseSla, resolutionSla, SLA_LABEL, formatDuration, type SlaStatus } from "@/lib/sla";

function SlaRow({ s }: { s: SlaStatus }) {
  let text: string;
  let cls: string;
  switch (s.state) {
    case "na":
      text = "—";
      cls = "text-muted";
      break;
    case "met":
      text = "Met";
      cls = "text-success";
      break;
    case "breached":
      text = `Overdue ${formatDuration(s.ms)}`;
      cls = "font-medium text-danger";
      break;
    case "warning":
      text = `Due in ${formatDuration(s.ms)}`;
      cls = "font-medium text-warning";
      break;
    default:
      text = `Due in ${formatDuration(s.ms)}`;
      cls = "text-foreground/80";
  }
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted">
        {SLA_LABEL[s.type]} <span className="text-foreground/40">· {s.targetHours}h</span>
      </span>
      <span className={cls}>{text}</span>
    </div>
  );
}

export default function SlaPanel({ ticket, awaitingSince }: { ticket: Ticket; awaitingSince: number | null }) {
  const slas = [firstResponseSla(ticket), nextResponseSla(ticket, awaitingSince), resolutionSla(ticket)];
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">Service levels</div>
      <div className="mt-3 space-y-2">
        {slas.map((s) => (
          <SlaRow key={s.type} s={s} />
        ))}
      </div>
    </div>
  );
}
