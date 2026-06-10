# SupportLoop — Living Roadmap

> This is the canonical, evolving roadmap. It's a **living document** — when something ships it moves to **Shipped**; new ideas land in **Planned**. Maintained across sessions (Claude keeps it current).

Last updated: 2026-06-07

---

## ✅ Shipped

- **Multi-tenant foundation** — orgs, org-scoped data layer, role-based access, RLS hardening (0006).
- **RBAC** (0011) — agent **groups** + group roles (member / group-admin), customer **account roles** (admin / member), and a pure permission model (`lib/rbac.ts`) enforced across KB (create/edit/publish/delete), ops automation, custom fields, settings & team — plus an admin team/group management UI and a `can()` test suite.
- **SLA engine** — first-response, ongoing next-response & resolution clocks (priority-based targets); per-ticket Service-levels panel, inbox SLA badge, dashboard compliance KPIs, and an **`sla.breach` workflow trigger** (a swept job — manual button + Vercel cron — that fires automation once per breached ticket) (`lib/sla.ts`, tested).
- **Customer self-service** — branded hosted help center, community, embeddable widget, grounded RAG chat that **escalates instead of hallucinating** (similarity guardrail, per-org threshold).
- **Operator console** — inbox/queues, ticket detail, triage, grounded draft replies, canned macros, knowledge loop (resolved ticket → drafted article).
- **AI depth** — AI insights (emerging themes + weekly narrative), **agent copilot** (summary, next action, similar tickets), **agentic tool-use** (investigate → propose refund → human-approved), **AI observability** (per-call cost/latency/grounding traces), **evals + faithfulness** (LLM-as-judge hallucination check).
- **Live chat** — Supabase Realtime (presence + typing).
- **Try-your-own-docs** — ephemeral grounded RAG on pasted docs.
- **Customers + accounts** — first-class user + account objects (0007), relationship views (a user's tickets, an account's people + tickets), agent-actions tied to the real customer.
- **Standard + custom fields** (0008) — CRM fields on customers/accounts; an admin **custom-field builder** (text/number/select/date/checkbox) for customer/account/ticket/doc; **editable inline** everywhere.
- **Rigor** — vitest unit tests, GitHub Actions CI.
- **Workflow engine** (0009/0010) — **v1:** `ticket.created` runs an LLM-in-the-loop sequence (triage → prioritize-by-account → grounded draft → extract custom fields). **v2:** rule **conditions**, the `csat.submitted` trigger, and **account/ticket-mutating actions** (escalate, flag account at-risk, note) — e.g. *low CSAT → escalate + flip the account to at-risk*. Per-ticket **Automation** panel + Ops **Workflows** management (toggle, condition, steps, run history).
- **Customer-site control** — live-chat escalation *inside the chatbot* (not a separate tab), a roomier/larger-type help center, per-component toggles (assistant / live chat / community), and custom-domain (CNAME) config.

---

## 🔜 Near-term (personalization payoffs from the customer/account model)

- **VIP / at-risk signals** — badges on inbox rows + ticket detail from account `health`/`plan` (e.g. Enterprise or `at_risk` → flag).
- **Plan-based SLA targets** — derive SLA targets from the account plan + a settings UI (the priority-based SLA engine, dashboard compliance, and the `sla.breach` workflow trigger already shipped).
- **Account-level alerts** — "3 open tickets on Acme Corp this week", roll-ups on the account page.
- **Field UX polish** — required-field enforcement on save, validation per type, bulk edit.

---

## 🧭 Planned — strategic bets

### 1. Workflow engine — LLM-in-the-loop automation  ⭐ headline bet

Events (**triggers**) fire **action sequences** that can read and modify the **ticket, the user (customer), and the account** — with **LLM steps in the loop**. This is the through-line that turns the existing AI features into composable automation.

- **Triggers:** `ticket.created`, `ticket.updated` (status / priority / intent change), `message.received`, `csat.submitted`, `customer.created`, `custom_field.changed`, schedule / `sla.breach_imminent`, inbound webhook / external event.
- **Conditions:** rule predicates over any ticket / customer / account field, **including custom fields** (e.g. `account.plan == Enterprise && ticket.intent == Billing`).
- **Actions:**
  - *Deterministic:* set field, assign, change priority/status, add tag, send canned reply, escalate, create task, update customer/account field, notify (webhook / email / Slack).
  - *LLM steps:* classify, summarize, draft reply, **extract structured data → fill custom fields**, decide routing, sentiment/risk scoring, and the existing **agentic tool-use as a workflow node** (investigate + propose actions).
- **Strategic placement (where workflows live):**
  - **Ticket intake** — new ticket → triage → route → auto-draft → optionally auto-resolve via the grounding guardrail.
  - **On resolve** — knowledge-gap detection → draft article (today's knowledge loop, expressed as a workflow).
  - **Low CSAT** — escalate + create follow-up + decrement account health.
  - **Account risk** — usage/sentiment signals → CSM task + at-risk flag.
- **Architecture sketch:** `workflows` (trigger + steps as JSON, org-scoped) + `workflow_runs` (execution log) tables; a server **executor** running steps sequentially — deterministic steps via the data layer, LLM steps via `lib/anthropic`, reusing `lib/agent-tools.ts` as action nodes; every LLM step traced via the existing `ai_trace`. Visual builder comes later.
- **Status:** ✅ **shipped** — intake automation, rule **conditions**, **four triggers** (`ticket.created`, `csat.submitted`, `status.changed`, `sla.breach`), ticket/account/**customer**-mutating actions, a **visual builder** (create / delete in the UI), and **async execution** (runs after the response via `@vercel/functions` `waitUntil`, so customer submits stay snappy). **Next:** an **inbound-webhook trigger** (also the substrate for external integrations).

### 2. External authentication + user/account provisioning  ⭐ headline bet

Let a customer's **end users authenticate** into SupportLoop (hosted help center / widget) as themselves, and provision users/accounts from outside — the identity layer that also feeds the workflow engine.

- **Identity (JWT handshake, Intercom-style):** the host app signs a token (user id, email, account, attributes) with a **per-org secret**; the widget/help center verifies it → the visitor is an authenticated end-user (not anonymous), and tickets attach to their real customer + account.
- **Provisioning API (per-org API key):**
  - `POST /api/v1/customers` — create/update an end-user (+ custom fields)
  - `POST /api/v1/accounts` — create/update an account
  - `POST /api/v1/tickets` — create on behalf of a user
  - `identify` — upsert the user from JWT attributes on first auth
- **Auto-provisioning:** on an authenticated external user's first appearance, upsert customer + account from the identify payload — which can itself **trigger a workflow** (e.g. welcome / onboarding).
- **Security:** per-org API keys (hashed, scoped), JWT signing secret in `organizations.settings`, rate limiting.
- **Phasing:** P1 per-org API key + provisioning REST → P2 JWT identity for widget/help center → P3 auto-provision + `identify` → P4 outbound webhooks + SCIM-style sync.

### 3. Customer-controlled site rollout & custom domains

Let customers own their help-center rollout, component by component.
- **Shipped start:** per-component toggles (assistant / live chat / community) + a custom-domain (CNAME) config UI.
- **Next:** real custom-domain provisioning (Vercel Domains API + verification), logo/theme controls beyond accent, section ordering + custom pages, a preview→publish flow, and multiple help centers per org.

### 4. Other planned

- **Outbound webhooks** (event bus) — also the substrate for external workflow triggers.
- **SLA engine** + breach triggers (feeds #1).
- **Reporting / exports**, saved views.
- **Doc lifecycle** — review-status workflows, stale-content detection.

---

## How we work the roadmap

- This file is the **source of truth** — update it as items ship or get planned.
- Build in **deployable phases**; each phase builds green + commits independently.
- Keep multi-tenancy + org-scoping invariant on every new table/route.
