# SupportLoop — AI customer support, as a closed loop

![Next.js](https://img.shields.io/badge/Next.js-14-000?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ecf8e?logo=supabase&logoColor=white) ![Claude](https://img.shields.io/badge/Anthropic-Claude-d97757) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)

**SupportLoop is a working, multi-tenant AI customer-support platform** — not a chatbot demo, but the whole support lifecycle as one closed loop: AI self-service → escalation → agent assist → knowledge generation → ops analytics → community, with every arrow feeding the next.

**▶ Live demo:** _add your deployment URL_ · one-click demo logins, no signup required.

> A portfolio piece by **Aidan Crosbie**. The thesis: I've *run* customer self-service at scale (Zoom, 10M→300M users, 90%+ deflection) **and** can *build* the LLM systems behind it. Most engineers build the bot; few also build the operator's analytics that prove it moved a business metric. This builds both — and treats "grounded, or escalate" as a hard rule, not a nice-to-have.
>
> The demo is configured for a fictional customer, **Orbit** (a video-collaboration app). The data is invented; the system is real — you can sign up and get your own isolated workspace.

---

## The idea: a flywheel, not a chatbot

```
  ① Customer asks  ─►  ② AI self-service (RAG)  ─►  ③ Escalation → Agent assist
     help center +        grounded answers              AI triage (intent/urgency/
     embeddable widget    deflect from the KB           sentiment) + a grounded
                          (or escalate, never guess)    draft reply to edit & send
                                                              │
   ⑥ Community Q&A                                            ▼
     AI suggests answers      ⑤ Ops dashboard  ◄──  ④ Knowledge loop: the resolved
     from the KB & surfaces      deflection %,          ticket becomes a new KB
     gaps ───────────────►       automation rate,       article (AI-drafted, human-
                  │              CSAT, volume, intents  approved, then published)
                  └──────────────────────────────────────────────┘
                         gaps + resolutions become the next articles,
                         which deflect the next question. The loop closes.
```

Every published article immediately improves retrieval, so the next identical question deflects instead of opening a ticket. That feedback loop is the whole point.

---

## What it does

**Customer (light, Zendesk/Freshdesk-grade help center)**
- Searchable help center + a **RAG chatbot** that answers from the knowledge base and **escalates honestly** when it can't — it never invents policy.
- A community forum (AI suggests grounded answers, flags gaps), a "Submit a request" web form, and a per-customer ticket portal.

**Agent (dark, Linear-style operator console)**
- A triaged inbox (intent, urgency, sentiment, priority, SLA, routing) with a **grounded draft reply** on every ticket — edit and send.
- The **knowledge loop**: turn a resolved ticket into a reusable article (AI-drafted → human-approved → published → re-embedded).

**Ops & quality**
- A dashboard of the metrics that matter — **deflection, automation rate, CSAT, volume, top intents, KB-from-tickets** — the business view that proves the AI moved a number.
- A real **eval harness**: golden questions run through the live retrieval pipeline, graded on grounded-rate, so prompt/model/KB changes are gated, not guessed.

**Product (it's a real multi-tenant SaaS)**
- **Organizations** with full data isolation; a real signup gets its own empty workspace and an onboarding wizard.
- **Bring-your-own-knowledge** (Markdown import), an **embeddable `<script>` chat widget** scoped per workspace, and per-org **hosted help centers** at `/help/<slug>`.
- It **dogfoods itself**: a "SupportLoop" workspace runs its own support on SupportLoop.

---

## See it live (guided path, ~2 minutes)

1. **Deflect vs. escalate.** From the home, open the Help Center and ask the assistant something the KB covers → a grounded answer **with citations**. Ask something it doesn't (e.g. *"can I get an editable transcript of a meeting?"*) → it declines to guess and **offers a ticket**.
2. **Close the loop.** One-click sign in as the **Agent** → open the flagged "demo" ticket → run **AI triage** + **draft a grounded reply** → resolve → **Knowledge Loop** → draft an article from the ticket → **publish**. Re-ask the chatbot — now it deflects. 🔁
3. **The business view.** Sign in as **Admin** → **Ops** (deflection/automation/CSAT) → **Quality** (run the evals) → **Admin** (import a KB, grab the widget snippet, manage the team).
4. **Multi-tenancy in one glance.** Compare `/help/orbit` and `/help/supportloop` — two real, **isolated** help centers from one platform. Or **sign up** a new workspace and watch it start empty and private.

---

## Architecture

```
 Next.js 14 App Router (RSC) ───────────────────────────────────────────────
   /user  · customer help center (light)     /agent · /ops · admin (dark)
   /help/[slug] · hosted help centers         /widget + /embed.js · embeddable
        │                                            │
        ▼  server route handlers (keys stay server-side)
   ┌──────────────────────────────────────────────────────────────────┐
   │  RAG pipeline                          AI (Anthropic Claude)        │
   │  Voyage voyage-3-lite embeddings  ┌──  generate: claude-sonnet-4-6  │
   │           │                       │    classify: claude-haiku-4-5   │
   │           ▼                       │    streamed (ReadableStream)    │
   │  pgvector match_kb() (cosine,     │                                 │
   │  org-scoped)  ──► grounding       │                                 │
   │  guardrail (threshold 0.60)  ─────┘  grounded → answer + citations  │
   │                                       below → escalate to a human   │
   └──────────────────────────────────────────────────────────────────┘
        │
        ▼  Supabase Postgres + pgvector — every row scoped by org_id (RLS + app-level)
   organizations · profiles · kb_articles · tickets · ticket_messages ·
   community_* · events · eval_runs · canned_responses
```

**Stack:** Next.js 14 (App Router, RSC) · TypeScript · Tailwind (bespoke token system, light customer / dark operator) · Supabase Postgres + **pgvector** · `@supabase/ssr` cookie auth · **Anthropic Claude** (Sonnet 4.6 generate, Haiku 4.5 classify, streamed) · **Voyage** `voyage-3-lite` embeddings (512-dim) · Recharts · Vercel.

---

## Engineering decisions worth calling out

- **Grounded, or it escalates.** Generation is constrained to retrieved KB. The grounding guardrail (`lib/guardrail.ts`) compares the top cosine similarity to a threshold (**0.60**) — below it, the surface escalates to a human instead of inventing a refund or security policy. The threshold was *tuned to the data*: `voyage-3-lite`'s compressed range puts uncovered topics ~0.56 and well-covered ones ~0.62, so 0.60 cleanly separates them.
- **A real eval harness, not vibes.** `/api/eval` runs a golden set through the actual retrieval pipeline and checks that "answer" questions ground above threshold and "escalate" questions fall below — the regression gate you'd put on every prompt/model change.
- **Multi-tenancy that's actually isolated.** Every table carries `org_id`; **`match_kb()` is org-scoped**, so one workspace's chatbot can never retrieve another's knowledge. Enforced in every query (service-role + explicit scoping) with RLS behind it.
- **Streaming with metadata side-channel.** Answers stream token-by-token via a `ReadableStream`; the grounding decision (confidence + cited sources) rides along in an `x-grounding` response header so the UI can render citations and a confidence state without buffering.
- **Human in the loop by design.** AI drafts; humans approve. KB articles never auto-publish; agent replies are always editable before send.
- **Keys never reach the browser.** All AI/DB calls run in server route handlers; the client only ever talks to first-party routes.

---

## How I'd take it to production

The gap between this and an enterprise deployment is mostly the unglamorous parts — and knowing them is half the job:

- **Evals → graded sets per intent** with regression gates in CI on every prompt/model bump (here: a single grounded-rate starter).
- **PII & safety:** redaction before the model sees a message, scoped retention, audit logging (out of scope for fictional data).
- **Tenant hardening:** tighten RLS policies to the JWT `org_id` as defense-in-depth beneath the app-level scoping.
- **Knowledge ingestion at scale:** native Zendesk/Intercom sync, crawl + re-embed on change, chunking strategy per doc type.
- **Cost/latency:** cache embeddings, route easy intents to the cheap model, stream everywhere, measure deflection $ saved.

---

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in the keys below
# apply supabase/migrations/0001…0004 in the Supabase SQL editor
npm run seed                 # seeds the Orbit demo + SupportLoop dogfood org
npm run dev
```

**Env (`.env.local`, all server-side except the public Supabase URL/anon key):**

| Var | What |
|---|---|
| `ANTHROPIC_API_KEY` | Claude (generate + classify) |
| `VOYAGE_API_KEY` | embeddings (`voyage-3-lite`) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side data access (never exposed) |
| `NEXT_PUBLIC_SITE_URL` | optional — base URL for OG tags + the widget snippet |

Demo logins are one-click on `/login`. The original staged build spec (Features → Spec → Build) lives in **[BUILD_PLAN.md](./BUILD_PLAN.md)**.

<!-- Screenshots: drop images in docs/ and uncomment.
![Help center](docs/help-center.png)
![Agent console](docs/agent.png)
![Ops dashboard](docs/ops.png)
-->

---

## About

A reference implementation built to demonstrate the full AI-support lifecycle end to end. **Orbit** is fictional; the data is invented; the application is real. Built by **Aidan Crosbie** — a customer-experience technology leader moving into AI/automation for CX.
