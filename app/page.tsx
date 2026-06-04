import Link from "next/link";
import RoleSwitcher from "@/components/RoleSwitcher";

const STEPS = [
  { n: "1", title: "Customer asks", body: "Orbit's help center with an AI chatbot that answers from the knowledge base." },
  { n: "2", title: "AI self-service (RAG)", body: "Grounded answers deflect routine questions. Anything unknown escalates instead of guessing." },
  { n: "3", title: "Escalation → Agent assist", body: "AI triages intent, urgency, and sentiment, then drafts a reply grounded in the KB." },
  { n: "4", title: "Knowledge loop", body: "Each resolved ticket can become a new KB article — drafted by AI, reviewed, published." },
  { n: "5", title: "Ops dashboard", body: "Deflection rate, automation rate, CSAT, volume, and top intents — the business view." },
  { n: "6", title: "Community Q&A", body: "AI answers from the KB and flags knowledge gaps, which feed back into step 4." },
];

const WORKSPACES = [
  {
    href: "/user",
    eyebrow: "Customer",
    title: "Orbit Help Center",
    body: "What an end customer sees: searchable help articles and an AI chatbot that deflects or escalates — plus a community forum.",
    surfaces: ["Help Center + AI chatbot", "Community Q&A"],
    cta: "Enter the help center",
  },
  {
    href: "/agent",
    eyebrow: "Agent",
    title: "Agent Workspace",
    body: "What a support agent uses: a ticket inbox with AI triage, sentiment, and a grounded draft reply they can edit and send.",
    surfaces: ["Agent Console + AI assist", "Knowledge Loop (ticket → article)"],
    cta: "Open the agent workspace",
  },
  {
    href: "/ops",
    eyebrow: "Ops",
    title: "Ops & Quality",
    body: "What a support leader watches: the metrics that prove the AI moved an outcome, plus an eval harness for reply quality.",
    surfaces: ["Ops Dashboard", "Quality / Evals"],
    cta: "See the dashboard",
  },
];

const PRODUCTION = [
  { h: "Real eval harness", p: "We ship a starter one (grounded-rate over golden questions). In production: graded test sets per intent, regression gates on every prompt/model change." },
  { h: "Human in the loop", p: "AI drafts; humans approve. KB articles are never auto-published; agent replies are editable before send." },
  { h: "Guardrails against hallucinated policy", p: "Answers are grounded only in retrieved KB. Below the similarity threshold, the system escalates rather than inventing a refund or security policy." },
  { h: "Measurement that matters", p: "Deflection, automation rate, CSAT, and KB-from-tickets are first-class — because the point is moving a business metric, not shipping a bot." },
  { h: "PII handling", p: "In production: redaction before the model sees a message, scoped retention, and audit logging. Out of scope for this demo's fictional data." },
  { h: "Feedback loops", p: "Resolved tickets and community gaps become new knowledge, which improves future deflection — the flywheel, closed." },
];

const STACK = ["Next.js 14", "TypeScript", "Supabase + pgvector", "Anthropic Claude", "Voyage embeddings", "Vercel"];

export default function Overview() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-lg font-bold text-accent-fg">
              ∞
            </span>
            <span className="font-semibold">SupportLoop</span>
          </div>
          <RoleSwitcher />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Portfolio demo · a fictional customer named Orbit
          </span>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            AI customer support, as a closed loop.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            SupportLoop is a reference implementation of the entire AI support lifecycle — self-service,
            agent assist, knowledge generation, and the operator analytics that prove it moved a metric.
            It is built as three real workspaces, the way an actual support stack is.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/user" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-strong">
              Enter the Help Center →
            </Link>
            <Link href="/agent" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface-2">
              Agent workspace
            </Link>
            <Link href="/ops" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface-2">
              Ops dashboard
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            <span className="font-medium text-foreground">Two sides of one system.</span> End customers
            see <span className="font-medium text-foreground">Orbit's</span> help center; the support team
            works inside the <span className="font-medium text-foreground">SupportLoop</span> operator
            console. Switch roles any time with the toggle in the top right.
          </div>
        </section>

        {/* Flywheel */}
        <section className="border-t border-border py-14">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">The flywheel</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-strong">
                  {s.n}
                </div>
                <div className="mt-3 font-medium">{s.title}</div>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Step 6 loops back to step 4: gaps the community surfaces become the next articles the chatbot
            uses to deflect. That feedback loop is the whole point.
          </p>
        </section>

        {/* Workspaces */}
        <section className="border-t border-border py-14">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Three workspaces</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {WORKSPACES.map((w) => (
              <div key={w.href} className="flex flex-col rounded-xl border border-border bg-surface p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-accent-strong">{w.eyebrow}</div>
                <div className="mt-1 text-lg font-semibold">{w.title}</div>
                <p className="mt-2 text-sm text-muted">{w.body}</p>
                <ul className="mt-4 space-y-1.5">
                  {w.surfaces.map((s) => (
                    <li key={s} className="flex gap-2 text-sm text-foreground/80">
                      <span className="text-accent">→</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                <Link href={w.href} className="mt-5 inline-block text-sm font-medium text-accent-strong hover:underline">
                  {w.cta} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="border-t border-border py-14">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">How it is built</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="font-medium">One spine, many surfaces</div>
              <p className="mt-2 text-sm text-muted">
                Every workspace reads and writes one shared Supabase schema with a pgvector knowledge base.
                That is what makes the loop actually close — a question deflected here becomes an article there.
                AI runs only in server-side route handlers; keys never reach the browser.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="font-medium">Grounded, or it escalates</div>
              <p className="mt-2 text-sm text-muted">
                Generated replies are grounded strictly in retrieved KB content. When retrieval confidence is
                below threshold, the system says so and hands off to a human instead of inventing policy.
                That guardrail — and tracking grounded vs. escalated — is the difference between a demo and a system.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {STACK.map((t) => (
              <span key={t} className="rounded-full bg-surface-2 px-3 py-1 text-xs text-foreground/70">
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* How I'd productionize */}
        <section className="border-t border-border py-14">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            How I would take this to production
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            The gap between a demo and an enterprise support-AI system is mostly the unglamorous parts. Here is
            where I would invest — informed by running self-service at scale.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTION.map((c) => (
              <div key={c.h} className="rounded-xl border border-border bg-surface p-5">
                <div className="font-medium">{c.h}</div>
                <p className="mt-1.5 text-sm text-muted">{c.p}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            A demonstration over a fictional product (Orbit). No real customers, no real metrics.
          </span>
          <span>Built by Aidan Crosbie</span>
        </div>
      </footer>
    </div>
  );
}
