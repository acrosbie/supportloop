# SupportLoop: roadmap and design notes

> What is built, what I would build next, and the reasoning behind the larger bets. The design sketches below are kept even for work that has already shipped, because the reasoning is the interesting part.

Last updated: 2026-08-03

---

## Shipped

- **Multi-tenant foundation**: orgs, an org-scoped data layer, role-based access, RLS hardening (0006).
- **RBAC** (0011): agent **groups** plus group roles (member / group-admin), customer **account roles** (admin / member), and a pure permission model (`lib/rbac.ts`) enforced across KB (create / edit / publish / delete), ops automation, custom fields, settings and team. Includes an admin team and group management UI, and a `can()` test suite.
- **SLA engine**: first-response, ongoing next-response and resolution clocks, with targets derived from priority and account plan. Per-ticket service-levels panel, inbox SLA badge, dashboard compliance KPIs, and an **`sla.breach` workflow trigger** swept by a manual button and a Vercel cron (`lib/sla.ts`, tested).
- **Workflow engine** (0009 / 0010): **v1:** `ticket.created` runs an LLM-in-the-loop sequence (triage, prioritize by account, grounded draft, extract custom fields). **v2:** rule **conditions**, the `csat.submitted` trigger, and account and ticket mutating actions (escalate, flag account at-risk, note). For example: low CSAT escalates and flips the account to at-risk. Per-ticket **Automation** panel plus Ops **Workflows** management (toggle, condition, steps, run history).
- **Integrations**: an inbound **webhook** (`POST /api/hooks/<slug>`, per-org secret, creates a ticket and fires `webhook.received`) and a **provisioning API** (`POST /api/v1/accounts|customers|tickets`, per-org API key) to create and update accounts, customers and tickets from external systems. Both configured in Admin → Workspace.
- **Customer self-service**: branded hosted help center, community, embeddable widget, and grounded RAG chat that **escalates instead of hallucinating** via a similarity guardrail with a per-org threshold.
- **Operator console**: inbox and queues, ticket detail, triage, grounded draft replies, canned macros, and the knowledge loop (resolved ticket becomes a drafted article).
- **AI depth**: AI insights (emerging themes plus a weekly narrative), **agent copilot** (summary, next action, similar tickets), **agentic tool-use** (investigate, propose refund, human-approved), **AI observability** (per-call cost, latency and grounding traces), and **evals plus faithfulness** (LLM-as-judge hallucination check).
- **Live chat**: Supabase Realtime with presence and typing.
- **Try your own docs**: ephemeral grounded RAG over pasted documents.
- **Customers and accounts**: first-class user and account objects (0007), relationship views (a user's tickets, an account's people and tickets), and agent-actions tied to the real customer.
- **Standard and custom fields** (0008): CRM fields on customers and accounts, plus an admin **custom-field builder** (text / number / select / date / checkbox) for customer, account, ticket and doc, **editable inline** everywhere.
- **Customer-site control**: live-chat escalation *inside the chatbot* rather than a separate tab, a roomier help center with larger type, per-component toggles (assistant / live chat / community), and custom-domain (CNAME) configuration.
- **Honest deflection accounting**: the deflection rate is computed from a conversation event stream, not from ticket rows. Every conversation logs exactly one outcome, the denominator is stated on the dashboard, and ticket metrics exclude deflected conversations so "tickets" means escalations. A **return window** subtracts deflections the customer came back from within four hours (a delay, not a win), and the dashboard shows that adjusted rate next to the naive one. `lib/deflection.ts`, tested. Written up in [Measuring deflection without fooling yourself](../docs/measuring-deflection.md).
- **Rigor**: vitest unit tests and GitHub Actions CI (lint, test, **eval**, build on every push and PR). The eval step is a real retrieval regression gate: the golden set replayed against recorded vectors (`npm run eval`), so it needs no API key and is deterministic. Hard assertion that no uncovered question may ground, floors on the answer/escalate split, and a fixture-integrity check that fails if the guardrail threshold moves without a re-record.

---

## Near-term

Personalization payoffs from the customer and account model:

- **VIP and at-risk signals**: badges on inbox rows and ticket detail derived from account `health` and `plan` (Enterprise or `at_risk` raises a flag).
- **Account-level alerts**: "3 open tickets on Acme Corp this week", rolled up on the account page.
- **Field UX polish**: required-field enforcement on save, per-type validation, bulk edit.

---

## Design notes on the headline bets

### 1. Workflow engine: LLM-in-the-loop automation ✅ shipped

Events (**triggers**) fire **action sequences** that can read and modify the **ticket, the customer, and the account**, with **LLM steps in the loop**. This is the through-line that turns discrete AI features into composable automation, and it is the piece I would build first in any real product.

- **Triggers shipped:** `ticket.created`, `csat.submitted`, `status.changed`, `sla.breach`, `webhook.received`.
- **Conditions:** rule predicates over any ticket, customer or account field, **including custom fields** (for example `account.plan == Enterprise && ticket.intent == Billing`).
- **Actions:**
  - *Deterministic:* set field, assign, change priority or status, add tag, send canned reply, escalate, update a customer or account field.
  - *LLM steps:* classify, summarize, draft reply, **extract structured data into custom fields**, decide routing, score sentiment and risk.
- **Where workflows earn their keep:** ticket intake (triage, route, auto-draft, optionally auto-resolve behind the grounding guardrail); on resolve (knowledge-gap detection and article drafting, which is the knowledge loop expressed as a workflow); low CSAT (escalate, follow up, decrement account health); account risk (usage and sentiment signals raise a CSM task).
- **Architecture:** `workflows` (trigger plus steps as JSON, org-scoped) and `workflow_runs` (execution log) tables, with a server executor running steps sequentially. Deterministic steps go through the data layer, LLM steps through `lib/anthropic`, and every LLM step is traced via `ai_trace`. Runs execute after the response via `@vercel/functions` `waitUntil`, so automation never blocks the request.
- **Remaining polish:** a graphical condition builder and step reordering. The visual builder currently handles create and delete.

### 2. External authentication and user provisioning ✅ shipped (P1–P3)

Let a customer's **end users authenticate** into SupportLoop (hosted help center or widget) as themselves, and provision users and accounts from outside. This is the identity layer that also feeds the workflow engine.

- **Identity (JWT handshake, Intercom-style):** the host app signs a token (user id, email, account, attributes) with a **per-org secret**. The widget or help center verifies it, the visitor becomes an authenticated end-user rather than an anonymous one, and tickets attach to their real customer and account.
- **Provisioning API (per-org API key):**
  - `POST /api/v1/customers`: create or update an end-user, including custom fields
  - `POST /api/v1/accounts`: create or update an account
  - `POST /api/v1/tickets`: create on behalf of a user
  - `POST /api/identify`: upsert the user from JWT attributes on first authentication
- **Auto-provisioning:** on an authenticated external user's first appearance, upsert the customer and account from the identify payload, which can itself **trigger a workflow** such as a welcome sequence.
- **Security:** per-org API keys, a JWT signing secret in `organizations.settings`, and rate limiting on the public identify endpoint.
- **Status:** ✅ **P1 shipped** (per-org API key, provisioning REST, inbound webhook). ✅ **P2 shipped** (JWT identity for the widget: pass `?token=` to `/widget`, verified against the per-org secret, with the signed-in visitor shown in the header). ✅ **P3 shipped** (auto-provision customer and account on `identify`; `/api/ticket` re-verifies the token server-side so an identified visitor's tickets attach to their real customer rather than trusting a client-supplied email). **Next:** P4 outbound webhooks and SCIM-style sync.

### 3. Customer-controlled rollout and custom domains

Let customers own their help-center rollout component by component.

- **Shipped start:** per-component toggles (assistant / live chat / community) and a custom-domain (CNAME) configuration UI.
- **Next:** real custom-domain provisioning (Vercel Domains API plus verification), logo and theme controls beyond accent colour, section ordering and custom pages, a preview-then-publish flow, and multiple help centers per org.

---

## Later

- **Outbound webhooks** (an event bus), which is also the substrate for external workflow triggers.
- **Reporting and exports**, plus saved views.
- **Doc lifecycle**: review-status workflows and stale-content detection.
- **Route-level tenancy tests.** The org-scoping invariant (every `lib/data.ts` export takes `orgId` first) is the product's central safety property and is currently asserted by convention rather than by a test. This is the highest-value test to add.
