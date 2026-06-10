import { describe, it, expect } from "vitest";
import { firstResponseSla, resolutionSla, nextResponseSla, awaitingAgentSince } from "../sla";
import type { Ticket } from "../types";

const HOUR = 3_600_000;

function tk(p: Partial<Ticket>): Ticket {
  return {
    id: "1",
    subject: "s",
    body: "b",
    channel: "chat",
    status: "open",
    intent: null,
    urgency: null,
    queue: null,
    sentiment: null,
    was_deflected: false,
    was_ai_assisted: false,
    csat: null,
    is_hero: false,
    requester_id: null,
    requester_email: null,
    customer_id: null,
    priority: "normal",
    assignee_id: null,
    tags: [],
    sla_due_at: null,
    first_response_at: null,
    created_at: new Date().toISOString(),
    resolved_at: null,
    custom_fields: {},
    ...p,
  };
}

describe("sla engine", () => {
  it("first response breaches when overdue and unanswered", () => {
    const t = tk({ priority: "urgent", created_at: new Date(Date.now() - 3 * HOUR).toISOString() }); // urgent target 1h
    expect(firstResponseSla(t).state).toBe("breached");
  });

  it("first response is met when answered within target", () => {
    const created = Date.now() - 5 * HOUR;
    const t = tk({
      priority: "normal", // 8h target
      created_at: new Date(created).toISOString(),
      first_response_at: new Date(created + 2 * HOUR).toISOString(),
    });
    expect(firstResponseSla(t).state).toBe("met");
  });

  it("resolution is on track within target", () => {
    const t = tk({ priority: "normal", created_at: new Date(Date.now() - HOUR).toISOString() }); // 72h target
    expect(["ok", "warning"]).toContain(resolutionSla(t).state);
  });

  it("next response is n/a when the ball is not in the agent's court", () => {
    expect(nextResponseSla(tk({}), null).state).toBe("na");
  });

  it("awaitingAgentSince tracks the last customer message (ignoring internal notes)", () => {
    const waiting = [
      { role: "customer", internal: false, created_at: new Date(Date.now() - 2 * HOUR).toISOString() },
      { role: "agent", internal: false, created_at: new Date(Date.now() - HOUR).toISOString() },
      { role: "customer", internal: false, created_at: new Date(Date.now() - 30 * 60000).toISOString() },
      { role: "agent", internal: true, created_at: new Date().toISOString() }, // internal note doesn't count
    ];
    expect(awaitingAgentSince(waiting)).not.toBeNull();

    const answered = [
      { role: "customer", internal: false, created_at: new Date(Date.now() - HOUR).toISOString() },
      { role: "agent", internal: false, created_at: new Date().toISOString() },
    ];
    expect(awaitingAgentSince(answered)).toBeNull();
  });

  it("plan factor tightens SLAs for higher plans", () => {
    // normal first-response base = 8h; 5h elapsed, unanswered.
    const t = tk({ priority: "normal", created_at: new Date(Date.now() - 5 * HOUR).toISOString() });
    expect(firstResponseSla(t, Date.now()).state).not.toBe("breached"); // 8h base → on track
    expect(firstResponseSla(t, Date.now(), "Enterprise").state).toBe("breached"); // ×0.5 → 4h → breached
  });
});
