# SupportLoop — AI Support Showcase

**SupportLoop** is an end-to-end **AI-for-customer-support** platform: a closed-loop flywheel — AI self-service (RAG) → escalation → agent-assist → knowledge generation → ops analytics → community. The demo runs it for a fictional sample customer, "Orbit" (a video/collaboration app).

Portfolio piece demonstrating both halves of an AI-for-CX skill set: understanding the *support lifecycle and its business metrics*, and *building the LLM systems* behind it.

**Stack:** Next.js 14 · TypeScript · Tailwind · Supabase (pgvector) · Anthropic Claude · Voyage embeddings · Vercel.

---

## 👉 Start here
A **starting** build spec lives in **[BUILD_PLAN.md](./BUILD_PLAN.md)** — treat it as a strong first draft to refine, not gospel.

### Kick-off prompt (paste into a fresh Claude Code session opened in this folder)
> I want to build a portfolio app: an AI-for-customer-support platform called "SupportLoop" — a closed-loop flywheel (RAG self-service → escalation → agent-assist → knowledge generation → ops dashboard → community). There's a starting spec in BUILD_PLAN.md and context in README.md.
>
> Let's work in three stages, and don't skip ahead:
> 1. **Features** — read the plan, then interview me. Propose the feature set, tell me what you'd add / cut / change, and ask the questions you need to lock scope.
> 2. **Spec** — once features are agreed, refine BUILD_PLAN.md into the final spec (data model, surfaces, prompts, phases).
> 3. **Build** — only then, build in deployable phases (Phase 0 spine first), stopping after each phase so I can deploy and verify.
>
> Start with stage 1. Do not write app code until we've aligned on features and the spec.

Status: **spec drafted, features/scope to be confirmed, implementation not started.**
