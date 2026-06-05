import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "border-border bg-surface-2 text-muted",
      accent: "border-accent/25 bg-accent-soft text-accent-strong",
      success: "border-success/25 bg-success-soft text-success",
      warning: "border-warning/25 bg-warning-soft text-warning",
      danger: "border-danger/25 bg-danger-soft text-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badge> {
  dot?: boolean;
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const STATUS: Record<string, { tone: Tone; label: string }> = {
  open: { tone: "neutral", label: "Open" },
  assisted: { tone: "accent", label: "In progress" },
  resolved: { tone: "success", label: "Resolved" },
  deflected: { tone: "success", label: "Deflected" },
  answered: { tone: "success", label: "Answered" },
  draft: { tone: "warning", label: "Draft" },
  published: { tone: "success", label: "Published" },
};

export function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? { tone: "neutral" as Tone, label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const PRIORITY: Record<string, { tone: Tone; label: string; dot: string }> = {
  low: { tone: "neutral", label: "Low", dot: "bg-muted" },
  normal: { tone: "neutral", label: "Normal", dot: "bg-accent" },
  medium: { tone: "accent", label: "Medium", dot: "bg-accent" },
  high: { tone: "warning", label: "High", dot: "bg-warning" },
  urgent: { tone: "danger", label: "Urgent", dot: "bg-danger" },
};

export function PriorityPill({ priority }: { priority: string }) {
  const p = PRIORITY[priority] ?? PRIORITY.normal;
  return (
    <Badge tone={p.tone}>
      <span className={cn("h-1.5 w-1.5 rounded-full", p.dot)} />
      {p.label}
    </Badge>
  );
}
