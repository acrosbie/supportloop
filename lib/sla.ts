// SLA engine — first-response, next-response (ongoing), and resolution clocks.
// Pure: computes status from a ticket (+ its messages for "next response").
// Targets are by priority; plan/per-org overrides can layer on later.
import type { Ticket } from "./types";

export type SlaType = "first_response" | "next_response" | "resolution";
export type SlaState = "met" | "ok" | "warning" | "breached" | "na";

const HOUR = 3_600_000;

const TARGETS: Record<SlaType, Record<string, number>> = {
  first_response: { urgent: 1, high: 4, normal: 8, low: 24 },
  next_response: { urgent: 2, high: 8, normal: 12, low: 48 },
  resolution: { urgent: 8, high: 24, normal: 72, low: 120 },
};

export const SLA_LABEL: Record<SlaType, string> = {
  first_response: "First response",
  next_response: "Next response",
  resolution: "Resolution",
};

function targetHours(type: SlaType, priority: string): number {
  return TARGETS[type][priority] ?? TARGETS[type].normal;
}

export interface SlaStatus {
  type: SlaType;
  state: SlaState;
  dueAt: number | null; // epoch ms
  ms: number; // remaining (ok/warning), overdue (breached), or |actual-due| (met)
  targetHours: number;
}

const isResolved = (s: string) => s === "resolved" || s === "deflected";

function pendingState(dueAt: number, now: number): { state: SlaState; ms: number } {
  if (now > dueAt) return { state: "breached", ms: now - dueAt };
  const remaining = dueAt - now;
  return { state: remaining < HOUR ? "warning" : "ok", ms: remaining };
}

export function firstResponseSla(t: Ticket, now = Date.now()): SlaStatus {
  const target = targetHours("first_response", t.priority);
  const dueAt = new Date(t.created_at).getTime() + target * HOUR;
  const respondedAt = t.first_response_at
    ? new Date(t.first_response_at).getTime()
    : isResolved(t.status) && t.resolved_at
      ? new Date(t.resolved_at).getTime()
      : null;
  if (respondedAt != null) {
    return { type: "first_response", state: respondedAt <= dueAt ? "met" : "breached", dueAt, ms: Math.abs(respondedAt - dueAt), targetHours: target };
  }
  return { type: "first_response", ...pendingState(dueAt, now), dueAt, targetHours: target };
}

export function resolutionSla(t: Ticket, now = Date.now()): SlaStatus {
  const target = targetHours("resolution", t.priority);
  const dueAt = new Date(t.created_at).getTime() + target * HOUR;
  if (t.resolved_at) {
    const r = new Date(t.resolved_at).getTime();
    return { type: "resolution", state: r <= dueAt ? "met" : "breached", dueAt, ms: Math.abs(r - dueAt), targetHours: target };
  }
  return { type: "resolution", ...pendingState(dueAt, now), dueAt, targetHours: target };
}

/** Ongoing-response SLA — only ticks while the customer awaits a reply.
 *  `awaitingSince` is when the unanswered customer message arrived, or null. */
export function nextResponseSla(t: Ticket, awaitingSince: number | null, now = Date.now()): SlaStatus {
  const target = targetHours("next_response", t.priority);
  if (isResolved(t.status) || awaitingSince == null) {
    return { type: "next_response", state: "na", dueAt: null, ms: 0, targetHours: target };
  }
  const dueAt = awaitingSince + target * HOUR;
  return { type: "next_response", ...pendingState(dueAt, now), dueAt, targetHours: target };
}

/** When the customer started waiting: the time of the latest non-internal
 *  message, if it's from the customer (ball in the agent's court). */
export function awaitingAgentSince(messages: { role: string; internal: boolean; created_at: string }[]): number | null {
  const external = messages.filter((m) => !m.internal);
  const last = external[external.length - 1];
  return last && last.role === "customer" ? new Date(last.created_at).getTime() : null;
}

/** The single most pressing SLA for compact (inbox) display. */
export function activeSla(t: Ticket, now = Date.now()): SlaStatus {
  if (isResolved(t.status)) return resolutionSla(t, now);
  return t.first_response_at ? resolutionSla(t, now) : firstResponseSla(t, now);
}

export function formatDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
