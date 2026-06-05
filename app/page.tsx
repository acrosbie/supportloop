import Link from "next/link";
import {
  ArrowRight,
  LifeBuoy,
  Headset,
  BarChart3,
  GitMerge,
  ShieldCheck,
  Boxes,
  Sparkles,
  MessageSquare,
  BookOpen,
  Users,
  FlaskConical,
  Gauge,
  Lock,
  RefreshCw,
} from "lucide-react";
import RoleSwitcher from "@/components/RoleSwitcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STEPS = [
  { icon: MessageSquare, title: "Customer asks", body: "Orbit's help center + an AI chatbot answer from the knowledge base." },
  { icon: Sparkles, title: "AI self-service (RAG)", body: "Grounded answers deflect routine questions; unknowns escalate instead of guessing." },
  { icon: Headset, title: "Escalation → Agent assist", body: "AI triages intent, urgency, and sentiment, then drafts a grounded reply." },
  { icon: BookOpen, title: "Knowledge loop", body: "Resolved tickets become new KB articles — AI-drafted, reviewed, published." },
  { icon: BarChart3, title: "Ops dashboard", body: "Deflection, automation rate, CSAT, volume, top intents — the business view." },
  { icon: Users, title: "Community Q&A", body: "AI answers from KB and flags gaps, which feed back into the knowledge loop." },
];

const WORKSPACES = [
  {
    href: "/user",
    icon: LifeBuoy,
    eyebrow: "Customer",
    title: "Orbit Help Center",
    body: "What an end customer sees: searchable help, an AI chatbot that deflects or escalates, and a community forum.",
    surfaces: ["Help Center + AI chatbot", "Community Q&A"],
  },
  {
    href: "/agent",
    icon: Headset,
    eyebrow: "Agent",
    title: "Agent Workspace",
    body: "What a support agent uses: a ticket inbox with AI triage, sentiment, and a grounded draft reply to edit and send.",
    surfaces: ["Agent console + AI assist", "Knowledge loop"],
  },
  {
    href: "/ops",
    icon: BarChart3,
    eyebrow: "Ops",
    title: "Ops & Quality",
    body: "What a support leader watches: the metrics that prove the AI moved a number, plus an eval harness for reply quality.",
    surfaces: ["Ops dashboard", "Quality / evals"],
  },
];

const PRODUCTION = [
  { icon: FlaskConical, h: "Real eval harness", p: "We ship a starter one (grounded-rate over golden questions). In production: graded sets per intent, regression gates on every prompt/model change." },
  { icon: ShieldCheck, h: "No hallucinated policy", p: "Answers are grounded only in retrieved KB. Below the similarity threshold the system escalates rather than inventing a refund or security policy." },
  { icon: Gauge, h: "Measurement that matters", p: "Deflection, automation rate, CSAT, and KB-from-tickets are first-class — the point is moving a business metric, not shipping a bot." },
  { icon: RefreshCw, h: "Feedback loops", p: "Resolved tickets and community gaps become new knowledge, which improves future deflection. The flywheel, closed." },
  { icon: Lock, h: "PII & safety", p: "In production: redaction before the model sees a message, scoped retention, audit logging. Out of scope for this demo's fictional data." },
  { icon: Boxes, h: "Human in the loop", p: "AI drafts; humans approve. KB articles never auto-publish; agent replies are editable before send." },
];

const STACK = ["Next.js 14", "TypeScript", "Supabase + pgvector", "Anthropic Claude", "Voyage embeddings", "Vercel"];

export default function Overview() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-fg">∞</span>
            <span className="font-semibold tracking-tight">SupportLoop</span>
          </div>
          <div className="flex items-center gap-3">
            <RoleSwitcher />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/user">
                Enter demo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(60rem 30rem at 70% -10%, rgb(var(--accent) / 0.10), transparent), radial-gradient(40rem 24rem at 5% 10%, rgb(var(--accent) / 0.06), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Reference implementation · fictional customer “Orbit”
          </span>
          <h1 className="mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            AI customer support, as a closed loop.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            SupportLoop is a working reference implementation of the entire AI support lifecycle — self-service,
            agent assist, knowledge generation, and the operator analytics that prove it moved a metric. Built as
            three real workspaces, the way an actual support stack is.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/user">
                Open the Help Center <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/agent">Agent workspace</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/ops">Ops dashboard</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            {STACK.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                {i > 0 && <span className="text-border-strong">·</span>}
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        {/* Two sides */}
        <section className="py-14">
          <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <GitMerge className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">Two sides of one system.</span> End customers see{" "}
                <span className="font-medium text-foreground">Orbit's</span> help center; the support team works inside
                the dark <span className="font-medium text-foreground">SupportLoop</span> operator console. Switch roles
                with the toggle, top right.
              </p>
            </div>
            <RoleSwitcher className="shrink-0" />
          </Card>
        </section>

        {/* Flywheel */}
        <section className="border-t border-border py-14">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">The flywheel</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={s.title} className="p-5 transition-colors hover:border-border-strong">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-muted">0{i + 1}</span>
                  </div>
                  <div className="mt-3 font-medium">{s.title}</div>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                </Card>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted">
            Step 6 loops back to step 4: gaps the community surfaces become the next articles the chatbot uses to
            deflect. That feedback loop is the whole point.
          </p>
        </section>

        {/* Workspaces */}
        <section className="border-t border-border py-14">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Three workspaces</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {WORKSPACES.map((w) => {
              const Icon = w.icon;
              return (
                <Card key={w.href} className="group flex flex-col p-6 transition-colors hover:border-accent">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-4 text-xs font-medium uppercase tracking-wide text-accent-strong">{w.eyebrow}</div>
                  <div className="mt-1 text-lg font-semibold">{w.title}</div>
                  <p className="mt-2 text-sm text-muted">{w.body}</p>
                  <ul className="mt-4 space-y-1.5">
                    {w.surfaces.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-sm text-foreground/80">
                        <ArrowRight className="h-3.5 w-3.5 text-accent" />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={w.href}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-strong group-hover:gap-2"
                  >
                    Enter <ArrowRight className="h-4 w-4 transition-all" />
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Architecture */}
        <section className="border-t border-border py-14">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">How it's built</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <Boxes className="h-5 w-5 text-accent" />
              <div className="mt-3 font-medium">One spine, many surfaces</div>
              <p className="mt-2 text-sm text-muted">
                Every workspace reads and writes one shared Supabase schema with a pgvector knowledge base. That's what
                makes the loop close — a question deflected here becomes an article there. AI runs only in server-side
                route handlers; keys never reach the browser.
              </p>
            </Card>
            <Card className="p-6">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <div className="mt-3 font-medium">Grounded, or it escalates</div>
              <p className="mt-2 text-sm text-muted">
                Generated replies are grounded strictly in retrieved KB content. When retrieval confidence is below
                threshold, the system says so and hands off to a human instead of inventing policy. Tracking grounded
                vs. escalated is the difference between a demo and a system.
              </p>
            </Card>
          </div>
        </section>

        {/* Productionize */}
        <section className="border-t border-border py-14">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">How I'd take this to production</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            The gap between a demo and an enterprise support-AI system is mostly the unglamorous parts. Here's where I'd
            invest — informed by running self-service at scale.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTION.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.h} className="p-5">
                  <Icon className="h-5 w-5 text-muted" />
                  <div className="mt-3 font-medium">{c.h}</div>
                  <p className="mt-1.5 text-sm text-muted">{c.p}</p>
                </Card>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>A demonstration over a fictional product (Orbit). No real customers, no real metrics.</span>
          <span>Built by Aidan Crosbie</span>
        </div>
      </footer>
    </div>
  );
}
