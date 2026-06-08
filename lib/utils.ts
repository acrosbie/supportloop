import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and de-dupe conflicting Tailwind classes. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Compact relative time: "just now", "5m", "3h", "2d". */
export function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/** Map an account plan to a Badge tone. */
export function planTone(plan: string): "neutral" | "accent" | "success" | "warning" {
  const p = plan.toLowerCase();
  if (p === "enterprise") return "accent";
  if (p === "business") return "success";
  if (p === "pro") return "warning";
  return "neutral";
}

