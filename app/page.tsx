import Link from "next/link";

const STEPS = [
  {
    n: "1",
    title: "Customer asks",
    body: "A help center with an AI chatbot that answers from Orbit's knowledge base.",
  },
  {
    n: "2",
    title: "AI self-service (RAG)",
    body: "Grounded answers deflect routine questions. Anything unknown escalates instead of guessing.",
  },
  {
    n: "3",
    title: "Escalation → Agent assist",
    body: "AI triages intent, urgency, and sentiment, then drafts a reply grounded in the KB.",
  },
  {
    n: "4",
    title: "Knowledge loop",
    body: "Each resolved ticket can become a new KB article — drafted by AI, reviewed, published.",
  },
  {
    n: "5",
    title: "Ops dashboard",
    body: "Deflection rate, automation rate, CSAT, volume, and top intents — the business view.",
  },
  {
    n: "6",
    title: "Community Q&A",
    body: "AI answers from the KB and flags knowledge gaps, which feed back into step 4.",
  },
];

const SURFACES = [
  { href: "/help", index: "01", title: "Help Center", desc: "Self-service + AI chatbot", phase: "Phase 1" },
  { href: "/agent", index: "02", title: "Agent Console", desc: "Triage, sentiment, grounded draft", phase: "Phase 1" },
  { href: "/knowledge", index: "03", title: "Knowledge Loop", desc: "Resolved tickets → KB articles", phase: "Phase 2" },
  { href: "/dashboard", index: "04", title: "Ops Dashboard", desc: "The business metrics", phase: "Phase 2" },
  { href: "/quality", index: "05", title: "Quality / Evals", desc: "Grounded-rate over golden questions", phase: "Phase 2" },
  { href: "/community", index: "06", title: "Community Q&A", desc: "AI answers + gap detection", phase: "Phase 3" },
];

const STACK = ["Next.js", "TypeScript", "Supabase + pgvector", "Anthropic Claude", "Voyage embeddings", "Vercel"];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Hero */}
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Portfolio demo · a fictional customer named Orbit
      </span>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance">
        AI customer support, as a closed loop.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        SupportLoop is a reference implementation of the entire AI support lifecycle — self-service,
        agent assist, knowledge generation, and the operator analytics that prove it moved a metric.
        Every surface reads and writes one shared knowledge base, so the loop actually closes.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/help"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-strong"
        >
          Step into the demo →
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface-2"
        >
          See the ops dashboard
        </Link>
      </div>

      {/* Flywheel */}
      <section className="mt-14">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">The flywheel</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          Step 6 loops back to step 4: gaps the community surfaces become the next articles the
          chatbot uses to deflect. That feedback loop is the whole point.
        </p>
      </section>

      {/* Surfaces */}
      <section className="mt-14">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Surfaces</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted">{s.index}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
                  {s.phase}
                </span>
              </div>
              <div className="mt-3 font-medium group-hover:text-accent-strong">{s.title}</div>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Honesty + stack */}
      <section className="mt-14 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-medium">Honest about what this is</h2>
        <p className="mt-2 text-sm text-muted">
          This is a demonstration over a fictional product (Orbit). The knowledge base, tickets, and
          metrics are seeded sample data — no real customers and no real numbers. What is real: the
          retrieval, the grounded generation, the escalate-when-unsure guardrail, and the architecture.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STACK.map((t) => (
            <span key={t} className="rounded-full bg-surface-2 px-3 py-1 text-xs text-foreground/70">
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
