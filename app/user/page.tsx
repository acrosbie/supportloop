import Link from "next/link";
import PreviewBadge from "@/components/PreviewBadge";

const CATEGORIES = [
  { name: "Account", count: 3, blurb: "Sign-in, passwords, profile" },
  { name: "Audio & Video", count: 6, blurb: "Mic, camera, echo, network" },
  { name: "Plans & Billing", count: 5, blurb: "Refunds, charges, upgrades" },
  { name: "Meetings", count: 3, blurb: "Scheduling, screen share, limits" },
  { name: "Recording", count: 2, blurb: "Cloud recordings & storage" },
  { name: "Security & Admin", count: 3, blurb: "SSO, 2FA, team members" },
];

const POPULAR = [
  "Reset your Orbit password",
  "Fix a microphone that isn't working in meetings",
  "Why was I charged twice? Duplicate charges",
  "Cloud recording storage limits",
  "Meeting time limits on Free and Pro plans",
];

export default function HelpCenter() {
  return (
    <div className="bg-white">
      {/* Search hero */}
      <section className="bg-gradient-to-b from-accent-soft to-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">How can we help?</h1>
          <p className="mt-2 text-muted">Search Orbit's help center, or ask the AI assistant.</p>
          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
            <span className="text-muted">⌕</span>
            <input
              disabled
              placeholder="Search for an answer…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Categories */}
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Browse by topic</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-white p-5 transition-colors hover:border-accent">
              <div className="font-medium">{c.name}</div>
              <p className="mt-1 text-sm text-muted">{c.blurb}</p>
              <div className="mt-3 text-xs text-muted">{c.count} articles</div>
            </div>
          ))}
        </div>

        {/* Popular + assistant */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Popular articles</h2>
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-white">
              {POPULAR.map((t) => (
                <li key={t} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <span>{t}</span>
                  <span className="text-muted">→</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface-2 p-5">
            <div className="flex items-center justify-between">
              <div className="font-medium">Orbit Assistant</div>
              <PreviewBadge phase="Phase 1" />
            </div>
            <p className="mt-2 text-sm text-muted">
              An AI chatbot that answers from these articles — with citations and a confidence score — and
              creates a support ticket when it can't answer from the knowledge base.
            </p>
            <button
              disabled
              className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg opacity-70"
            >
              Ask the assistant
            </button>
          </div>
        </div>

        <p className="mt-8 text-xs text-muted">
          Articles, search, and the chatbot become live once the database is seeded.{" "}
          <Link href="/" className="text-accent-strong hover:underline">
            What is this?
          </Link>
        </p>
      </div>

      {/* Help-center style chat launcher */}
      <button
        disabled
        className="fixed bottom-6 right-6 hidden items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-fg shadow-lg sm:flex"
      >
        💬 Ask Orbit Assistant
      </button>
    </div>
  );
}
