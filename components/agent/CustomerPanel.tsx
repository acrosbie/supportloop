import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChannelIcon, channelLabel } from "@/components/ui/channel-icon";
import type { CustomerContext } from "@/lib/data";

const planTone = (plan: string): "neutral" | "accent" | "success" | "warning" => {
  const p = plan.toLowerCase();
  if (p === "enterprise") return "accent";
  if (p === "business") return "success";
  if (p === "pro") return "warning";
  return "neutral";
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default function CustomerPanel({
  ctx,
  fallbackEmail,
  channel,
  createdAt,
  firstResponseAt,
  slaDueAt,
  resolved,
}: {
  ctx: CustomerContext | null;
  fallbackEmail: string;
  channel: string;
  createdAt: string;
  firstResponseAt: string | null;
  slaDueAt: string | null;
  resolved: boolean;
}) {
  const name = ctx?.customer.name || fallbackEmail;
  const subtitle = ctx
    ? [ctx.customer.title, ctx.account?.name].filter(Boolean).join(" · ") || "Customer"
    : "Requester";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar name={name} className="h-10 w-10 text-sm" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="truncate text-xs text-muted">{subtitle}</div>
        </div>
      </div>

      {ctx?.account && (
        <div className="mt-3 rounded-lg border border-border bg-surface-2 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium">{ctx.account.name}</span>
            <Badge tone={planTone(ctx.account.plan)}>{ctx.account.plan}</Badge>
          </div>
          <div className="mt-2 space-y-1 text-[11px]">
            <Row label="Status" value={<span className="capitalize">{ctx.account.status}</span>} />
            <Row label="Health" value={<span className="capitalize">{ctx.account.health.replace("_", " ")}</span>} />
            <Row label="Seats" value={ctx.account.seats} />
            <Row label="MRR" value={`$${ctx.account.mrr.toLocaleString()}/mo`} />
            {ctx.account.since && <Row label="Customer since" value={new Date(ctx.account.since).getFullYear()} />}
          </div>
        </div>
      )}

      {ctx && (
        <div className="mt-2 space-y-1 text-xs">
          <Row label="Lifetime tickets" value={ctx.lifetimeTickets} />
          <Row label="Avg CSAT" value={ctx.avgCsat != null ? ctx.avgCsat.toFixed(1) : "—"} />
          <Row label="Email" value={<span className="truncate">{ctx.customer.email}</span>} />
        </div>
      )}

      <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs">
        <Row
          label="Channel"
          value={
            <span className="flex items-center justify-end gap-1">
              <ChannelIcon channel={channel} className="h-3 w-3" />
              {channelLabel(channel)}
            </span>
          }
        />
        <Row label="Opened" value={new Date(createdAt).toLocaleDateString()} />
        {firstResponseAt && <Row label="First reply" value={new Date(firstResponseAt).toLocaleDateString()} />}
        {slaDueAt && !resolved && <Row label="SLA due" value={new Date(slaDueAt).toLocaleString()} />}
      </div>
    </div>
  );
}
