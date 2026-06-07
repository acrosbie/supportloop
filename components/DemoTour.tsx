"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, X, Check, ArrowRight } from "lucide-react";

// The scripted flywheel path for a cold reviewer. Each step deep-links to the
// surface where it happens; the seeded "demo" (hero) ticket anchors the story.
const STEPS = [
  {
    t: "Ask something the bot can't answer",
    d: "In the Help Center, ask about an editable meeting transcript — it won't guess, it offers a ticket.",
    href: "/user",
  },
  { t: "Sign in as a support agent", d: "One-click “Maya Chen · agent” on the login page.", href: "/login" },
  {
    t: "Work the flagged demo ticket",
    d: "Open the ticket tagged “demo” → run AI triage → draft a grounded reply → resolve.",
    href: "/agent",
  },
  {
    t: "Close the loop: make knowledge",
    d: "Knowledge Loop → draft an article from the resolved ticket → publish.",
    href: "/agent/knowledge",
  },
  {
    t: "Re-ask — now it deflects",
    d: "Back in the Help Center, the same question is answered from the new article.",
    href: "/user",
  },
  {
    t: "See the business view",
    d: "The Ops dashboard: deflection, automation, CSAT — proof the AI moved a metric.",
    href: "/ops",
  },
];

export default function DemoTour() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true); // hidden until localStorage is read (no flash)
  const [done, setDone] = useState<number[]>([]);
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  // Operator surfaces have a left rail (and no chat widget); dock right there,
  // and left on customer/marketing (opposite the chat widget).
  const onRight = pathname.startsWith("/agent") || pathname.startsWith("/ops");

  useEffect(() => {
    setDismissed(localStorage.getItem("sl-tour-dismissed") === "1");
    try {
      setDone(JSON.parse(localStorage.getItem("sl-tour-done") || "[]"));
    } catch {
      /* ignore */
    }
    // Only show for anonymous visitors + demo accounts — not real signups.
    fetch("/api/tour")
      .then((r) => r.json())
      .then((j) => setShow(!!j.show))
      .catch(() => setShow(false));
  }, []);

  function dismiss() {
    localStorage.setItem("sl-tour-dismissed", "1");
    setDismissed(true);
    setOpen(false);
  }

  function toggleDone(i: number) {
    setDone((d) => {
      const next = d.includes(i) ? d.filter((x) => x !== i) : [...d, i];
      localStorage.setItem("sl-tour-done", JSON.stringify(next));
      return next;
    });
  }

  if (dismissed || !show) return null;

  return (
    <div className={`fixed bottom-5 z-50 print:hidden ${onRight ? "right-5" : "left-5"}`}>
      {open && (
        <div className="mb-3 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl animate-content-in">
          <div className="flex items-center justify-between bg-gradient-to-br from-accent-strong to-accent px-4 py-3 text-accent-fg">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Compass className="h-4 w-4" /> Reviewer? Start here
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close tour" className="rounded p-1 hover:bg-white/20">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-slate-500">Follow the flywheel in ~2 minutes. Tap a step to open it.</p>
            <ol className="mt-3 space-y-1">
              {STEPS.map((s, i) => {
                const isDone = done.includes(i);
                return (
                  <li key={i} className="flex gap-2.5">
                    <button
                      onClick={() => toggleDone(i)}
                      aria-label={isDone ? "Mark step not done" : "Mark step done"}
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition ${
                        isDone ? "border-accent bg-accent text-accent-fg" : "border-slate-300 text-slate-500 hover:border-accent"
                      }`}
                    >
                      {isDone ? <Check className="h-3 w-3" /> : i + 1}
                    </button>
                    <Link
                      href={s.href}
                      onClick={() => setOpen(false)}
                      className="group min-w-0 flex-1 rounded-lg px-1.5 py-1 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-1 text-[13px] font-medium text-slate-800">
                        {s.t}
                        <ArrowRight className="h-3 w-3 text-accent opacity-0 transition group-hover:opacity-100" />
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500">{s.d}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <button onClick={dismiss} className="mt-3 text-xs text-slate-400 hover:text-slate-600">
              Dismiss tour
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg shadow-lg transition hover:bg-accent-strong"
      >
        <Compass className="h-4 w-4" />
        Reviewer? Start here
      </button>
    </div>
  );
}
