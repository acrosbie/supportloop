import Link from "next/link";
import {
  ArrowRight,
  Headset,
  BarChart3,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  BookOpen,
  Users,
  FlaskConical,
  Upload,
  Code2,
  Check,
  LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STEPS = [
  { icon: MessageSquare, title: "Customer asks", body: "Your help center + an AI chatbot answer from your own knowledge base." },
  { icon: Sparkles, title: "AI self-service (RAG)", body: "Grounded answers deflect routine questions; unknowns escalate instead of guessing." },
  { icon: Headset, title: "Escalation → Agent assist", body: "AI triages intent, urgency, and sentiment, then drafts a grounded reply for your team." },
  { icon: BookOpen, title: "Knowledge loop", body: "Resolved tickets become new KB articles — AI-drafted, reviewed, published." },
  { icon: BarChart3, title: "Ops dashboard", body: "Deflection, automation rate, CSAT, volume, top intents — the business view." },
  { icon: Users, title: "Community Q&A", body: "AI answers from your KB and flags gaps, which feed back into the knowledge loop." },
];

const FEATURES = [
  { icon: Sparkles, title: "Grounded AI self-service", body: "A help-center chatbot that answers only from your knowledge — and escalates honestly when it can't, instead of inventing policy." },
  { icon: Headset, title: "Agent assist", body: "Every ticket arrives triaged (intent, urgency, sentiment) with a grounded draft reply your agents edit and send." },
  { icon: BookOpen, title: "The knowledge loop", body: "Turn resolved tickets and community gaps into new articles — drafted by AI, approved by a human, never auto-published." },
  { icon: BarChart3, title: "Ops analytics", body: "Deflection, automation rate, CSAT, volume and top intents — the metrics that prove the AI moved a number." },
  { icon: Upload, title: "Bring your own knowledge", body: "Import your existing help center: paste or upload Markdown, and it's chunked, embedded, and searchable in minutes." },
  { icon: Code2, title: "Embeddable everywhere", body: "Drop the chat widget on any site with a snippet, scoped to your workspace's knowledge. (Rolling out.)" },
  { icon: FlaskConical, title: "Quality you can measure", body: "A built-in eval harness grades grounded-rate over a golden set, so prompt and model changes are gated, not guessed." },
  { icon: ShieldCheck, title: "Tenant isolation by design", body: "Every workspace's data — knowledge, tickets, metrics, retrieval — is fully isolated. Your data answers only your customers." },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "For trying it on a real help center.",
    features: ["1 workspace", "1 agent seat", "Help center + AI chatbot", "Community Q&A", "Up to 50 AI replies / mo"],
    cta: "Start free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Team",
    price: "$49",
    cadence: "per agent / mo",
    blurb: "For growing support teams.",
    features: ["Everything in Free", "Unlimited articles + KB import", "Agent assist + macros", "SLA & routing", "Eval harness", "Ops analytics"],
    cta: "Start free trial",
    href: "/signup",
    highlight: true,
  },
  {
    name: "Business",
    price: "$99",
    cadence: "per agent / mo",
    blurb: "For scale and compliance.",
    features: ["Everything in Team", "SSO & SCIM", "Audit log & retention controls", "Advanced analytics", "Priority support"],
    cta: "Talk to us",
    href: "/signup",
    highlight: false,
  },
];

const DEMO_SURFACES = [
  { href: "/user", icon: LifeBuoy, eyebrow: "Customer", title: "Help Center", body: "The end-customer view: searchable help, an AI chatbot, and community." },
  { href: "/agent", icon: Headset, eyebrow: "Agent", title: "Agent Workspace", body: "The support team's console: triaged inbox, AI-drafted replies, knowledge loop." },
  { href: "/ops", icon: BarChart3, eyebrow: "Ops", title: "Ops & Quality", body: "The leader's dashboard: deflection, automation, CSAT — plus an eval harness." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-fg">∞</span>
            <span className="font-semibold tracking-tight">SupportLoop</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <Link href="/about" className="hover:text-foreground">About</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">
                Start free <ArrowRight className="h-4 w-4" />
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
            The closed-loop support platform
          </span>
          <h1 className="mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Close the loop on customer support.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            SupportLoop deflects routine questions with grounded AI, drafts replies for your agents, turns every
            resolved ticket into knowledge, and shows you the metrics that prove it — one platform, one closed loop.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/user">See a live demo</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted">
            No credit card. Spin up a workspace and import your help center in minutes.
          </p>
          <Link href="/try" className="mt-3 inline-block text-sm font-medium text-accent-strong hover:underline">
            Or paste your own docs and ask it anything →
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        {/* How it works / flywheel */}
        <section id="how" className="scroll-mt-20 py-16">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">How it works</h2>
          <p className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight">
            A flywheel, not a chatbot. Each step makes the next one better.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-t border-border py-16">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Features</h2>
          <p className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight">
            Everything to run AI support — and prove it works.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-4 font-medium">{f.title}</div>
                  <p className="mt-1.5 text-sm text-muted">{f.body}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Two sides */}
        <section className="border-t border-border py-16">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Two sides, one system</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <LifeBuoy className="h-5 w-5 text-accent" />
              <div className="mt-3 font-medium">A help center your customers love</div>
              <p className="mt-2 text-sm text-muted">
                A clean, branded help center with an AI assistant that resolves the routine and escalates the rest —
                so your team only sees what actually needs a human.
              </p>
            </Card>
            <Card className="p-6">
              <Headset className="h-5 w-5 text-accent" />
              <div className="mt-3 font-medium">An operator console your team lives in</div>
              <p className="mt-2 text-sm text-muted">
                A fast, keyboard-driven workspace: triaged queues, grounded draft replies, SLA and routing, the
                knowledge loop, and the analytics that prove the AI is pulling its weight.
              </p>
            </Card>
          </div>
        </section>

        {/* See it live */}
        <section className="border-t border-border py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted">See it live</h2>
              <p className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight">Explore a fully seeded workspace.</p>
            </div>
            <span className="text-sm text-muted">A fully seeded sample workspace.</span>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {DEMO_SURFACES.map((w) => {
              const Icon = w.icon;
              return (
                <Card key={w.href} className="group flex flex-col p-6 transition-colors hover:border-accent">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-4 text-xs font-medium uppercase tracking-wide text-accent-strong">{w.eyebrow}</div>
                  <div className="mt-1 text-lg font-semibold">{w.title}</div>
                  <p className="mt-2 text-sm text-muted">{w.body}</p>
                  <Link
                    href={w.href}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-strong group-hover:gap-2"
                  >
                    Open <ArrowRight className="h-4 w-4 transition-all" />
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 border-t border-border py-16">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Pricing</h2>
          <p className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight">Start free. Grow when it works.</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {PRICING.map((t) => (
              <Card
                key={t.name}
                className={`relative flex flex-col p-6 ${t.highlight ? "border-accent ring-1 ring-accent" : ""}`}
              >
                {t.highlight && (
                  <span className="absolute -top-2.5 left-6 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-fg">
                    Most popular
                  </span>
                )}
                <div className="font-medium">{t.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">{t.price}</span>
                  <span className="text-sm text-muted">{t.cadence}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{t.blurb}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" variant={t.highlight ? "primary" : "outline"}>
                  <Link href={t.href}>{t.cta}</Link>
                </Button>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">
            Illustrative pricing — SupportLoop is a portfolio demo, not a billed product.{" "}
            <Link href="/about" className="underline hover:text-foreground">
              Read about the project
            </Link>
            .
          </p>
        </section>

        {/* CTA band */}
        <section className="border-t border-border py-16">
          <Card className="flex flex-col items-center gap-4 overflow-hidden p-10 text-center">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">Close your support loop.</h2>
            <p className="max-w-xl text-muted">
              Spin up a workspace, bring your knowledge, and watch routine questions resolve themselves.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/user">See the demo</Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-fg">∞</span>
            <span className="font-medium text-foreground">SupportLoop</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <Link href="/about" className="hover:text-foreground">About this project</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
