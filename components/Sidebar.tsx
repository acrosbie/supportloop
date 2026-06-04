"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", hint: "The flywheel" },
  { href: "/help", label: "Help Center", hint: "Self-service + chatbot" },
  { href: "/agent", label: "Agent Console", hint: "Triage + assist" },
  { href: "/knowledge", label: "Knowledge Loop", hint: "Tickets → KB" },
  { href: "/dashboard", label: "Ops Dashboard", hint: "Metrics" },
  { href: "/community", label: "Community", hint: "Q&A + gaps" },
  { href: "/quality", label: "Quality", hint: "Evals" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="border-b border-border px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-lg font-bold text-accent-fg">
            ∞
          </span>
          <span className="leading-tight">
            <span className="block font-semibold">SupportLoop</span>
            <span className="block text-xs text-muted">AI support, end to end</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {NAV.map((item, i) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent-soft font-medium text-accent-strong"
                  : "text-foreground/80 hover:bg-surface-2"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md text-xs ${
                  active ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"
                }`}
              >
                {item.href === "/" ? "⌂" : i}
              </span>
              <span className="flex-1">
                <span className="block">{item.label}</span>
                <span className="block text-xs text-muted">{item.hint}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4 text-xs text-muted">
        Demo · fictional customer{" "}
        <span className="font-medium text-foreground/70">Orbit</span>
      </div>
    </aside>
  );
}
