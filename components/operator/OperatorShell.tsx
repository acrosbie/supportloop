"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleSwitcher from "@/components/RoleSwitcher";
import ResetButton from "@/components/ResetButton";

export interface OperatorNavItem {
  href: string;
  label: string;
  hint: string;
  exact?: boolean;
}

/**
 * The dense "operator workspace" chrome shared by the Agent and Ops spaces —
 * left rail + a top bar with search, the role switcher, and reset. This is the
 * SupportLoop side (the tool the support team uses), distinct from the friendly
 * Orbit help center customers see.
 */
export default function OperatorShell({
  tagline,
  operator,
  nav,
  children,
}: {
  tagline: string;
  operator: { name: string; role: string };
  nav: OperatorNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const initials = operator.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-2">
      {/* Left rail */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="border-b border-border px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-lg font-bold text-accent-fg">
              ∞
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">SupportLoop</span>
              <span className="block text-xs text-muted">{tagline}</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (!item.exact && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-accent bg-accent-soft font-medium text-accent-strong"
                    : "border-transparent text-foreground/80 hover:bg-surface-2"
                }`}
              >
                <span className="flex-1">
                  <span className="block">{item.label}</span>
                  <span className="block text-xs text-muted">{item.hint}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-4 py-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
              {initials}
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-medium">{operator.name}</span>
              <span className="block text-xs text-muted">{operator.role}</span>
            </span>
          </div>
          <ResetButton />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-2.5 md:px-6">
          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted">
              <span className="text-muted">⌕</span>
              <span className="truncate">Search tickets, articles…</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted lg:inline">Viewing as</span>
            <RoleSwitcher />
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
