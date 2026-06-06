import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  FlaskConical,
  ShieldCheck,
  Gauge,
  RefreshCw,
  Lock,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = { title: "About" };

const PRODUCTION = [
  { icon: FlaskConical, h: "Real eval harness", p: "The demo ships a starter one (grounded-rate over golden questions). In production: graded sets per intent, regression gates on every prompt/model change." },
  { icon: ShieldCheck, h: "No hallucinated policy", p: "Answers are grounded only in retrieved KB. Below the similarity threshold the system escalates rather than inventing a refund or security policy." },
  { icon: Gauge, h: "Measurement that matters", p: "Deflection, automation rate, CSAT, and KB-from-tickets are first-class — the point is moving a business metric, not shipping a bot." },
  { icon: RefreshCw, h: "Feedback loops", p: "Resolved tickets and community gaps become new knowledge, which improves future deflection. The flywheel, closed." },
  { icon: Lock, h: "PII & safety", p: "In production: redaction before the model sees a message, scoped retention, audit logging. Out of scope for this demo's fictional data." },
  { icon: Boxes, h: "Multi-tenant from the core", p: "Every workspace's knowledge, tickets, metrics, and retrieval are isolated by org_id. A real sign-up gets its own private workspace." },
];

const STACK = ["Next.js 14 (App Router)", "TypeScript", "Supabase Postgres + pgvector", "Anthropic Claude", "Voyage embeddings", "Tailwind CSS", "Vercel"];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-fg">∞</span>
            <span className="font-semibold tracking-tight">SupportLoop</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          About this project
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight">
          A working reference implementation of AI customer support.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          SupportLoop is a portfolio piece by <span className="font-medium text-foreground">Aidan Crosbie</span> — a
          customer-experience technology leader moving into AI/automation for CX. It exists to prove one thing end to
          end: that the entire AI support lifecycle — self-service, agent assist, knowledge generation, and the
          operator analytics that prove it moved a metric — can be designed <em>and built</em> as one cohesive system.
        </p>

        {/* What's real vs fictional */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <div className="font-medium text-foreground">What&apos;s real</div>
            <p className="mt-2 text-sm text-muted">
              The application is real and running: a Postgres + pgvector knowledge base, retrieval with a grounding
              guardrail, streaming Claude completions, multi-tenant data isolation, real auth, and a full case-management
              workspace. You can sign up and get your own private workspace.
            </p>
          </Card>
          <Card className="p-6">
            <div className="font-medium text-foreground">What&apos;s fictional</div>
            <p className="mt-2 text-sm text-muted">
              The seeded demo is configured for an invented customer called <span className="font-medium text-foreground">Orbit</span>{" "}
              (a nod to video-collaboration tools). The tickets, articles, metrics, and people are all fabricated. No
              real customers, no real data, no real revenue.
            </p>
          </Card>
        </div>

        {/* Productionize */}
        <section className="mt-14">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">How I&apos;d take it to production</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            The gap between a demo and an enterprise support-AI system is mostly the unglamorous parts. Here&apos;s where
            I&apos;d invest — informed by running self-service at scale.
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

        {/* Stack */}
        <section className="mt-14">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">Built with</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {STACK.map((s) => (
              <span key={s} className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-foreground/80">
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 flex flex-wrap items-center gap-3 border-t border-border pt-10">
          <Button asChild size="lg">
            <Link href="/user">
              Explore the live demo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Create your own workspace</Link>
          </Button>
        </section>
        <p className="mt-8 text-sm text-muted">Built by Aidan Crosbie.</p>
      </div>
    </div>
  );
}
