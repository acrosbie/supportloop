// Mock "back-office" tools the agent assistant can call (Claude tool-use). In a
// real deployment these would hit billing/CRM/order systems; here they return
// deterministic fake data so the agentic loop is demoable end-to-end.

export const AGENT_TOOLS = [
  {
    name: "lookup_account",
    description: "Look up a customer's account (plan, status, tenure) by email.",
    input_schema: {
      type: "object" as const,
      properties: { email: { type: "string", description: "the customer's email" } },
      required: ["email"],
    },
  },
  {
    name: "recent_charges",
    description: "List the customer's recent charges/invoices by email.",
    input_schema: {
      type: "object" as const,
      properties: { email: { type: "string" } },
      required: ["email"],
    },
  },
  {
    name: "issue_refund",
    description:
      "PROPOSE a refund for a specific charge. This does NOT execute — it requires a human agent to approve.",
    input_schema: {
      type: "object" as const,
      properties: {
        invoice_id: { type: "string" },
        amount: { type: "number" },
        reason: { type: "string" },
      },
      required: ["invoice_id", "amount", "reason"],
    },
  },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function lookupAccount(email: string) {
  const h = hash(email);
  const plans = ["Free", "Pro", "Business"];
  return {
    email,
    name: email.split("@")[0],
    plan: plans[h % plans.length],
    member_since: `202${h % 4}-0${(h % 9) + 1}-12`,
    status: "active",
  };
}

export function recentCharges(email: string) {
  const h = hash(email);
  const inv = (n: number) => `INV-${1000 + (Math.abs(n) % 9000)}`;
  // A duplicate same-day charge — the classic "charged twice" scenario.
  return [
    { invoice_id: inv(h), item: "Pro subscription — monthly", amount: 18.0, date: "2026-05-01" },
    { invoice_id: inv(h * 7), item: "Pro subscription — monthly", amount: 18.0, date: "2026-05-01" },
  ];
}
