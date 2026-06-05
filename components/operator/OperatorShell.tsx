"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Inbox, BookOpen, LayoutDashboard, FlaskConical, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import RoleSwitcher from "@/components/RoleSwitcher";
import ResetButton from "@/components/ResetButton";
import LogoutButton from "@/components/auth/LogoutButton";
import { Avatar } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Icons are referenced by string key so the (server) layouts can pass nav data
// across the server→client boundary without serializing components.
const ICON_MAP: Record<string, LucideIcon> = {
  inbox: Inbox,
  knowledge: BookOpen,
  dashboard: LayoutDashboard,
  quality: FlaskConical,
  admin: ShieldCheck,
};

export interface OperatorNavItem {
  href: string;
  label: string;
  hint: string;
  icon: string;
  exact?: boolean;
}

function Brand({ tagline }: { tagline: string }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-fg">
        ∞
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-foreground">SupportLoop</span>
        <span className="block text-xs text-muted">{tagline}</span>
      </span>
    </Link>
  );
}

function NavLinks({
  nav,
  pathname,
  onNavigate,
}: {
  nav: OperatorNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-0.5 px-2 py-3">
      {nav.map((item) => {
        const active = pathname === item.href || (!item.exact && pathname.startsWith(item.href + "/"));
        const Icon = ICON_MAP[item.icon] ?? Inbox;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 transition-colors",
              active
                ? "border-accent bg-accent-soft text-foreground"
                : "border-transparent text-muted hover:bg-surface-2 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-accent-strong" : "text-muted group-hover:text-foreground")} />
            <span className="flex-1">
              <span className="block text-sm font-medium leading-tight">{item.label}</span>
              <span className="block text-xs text-muted">{item.hint}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function Identity({ operator }: { operator: { name: string; role: string } }) {
  return (
    <div className="border-t border-border p-3">
      <div className="mb-3 flex items-center gap-2.5">
        <Avatar name={operator.name} />
        <span className="leading-tight">
          <span className="block text-sm font-medium text-foreground">{operator.name}</span>
          <span className="block text-xs text-muted">{operator.role}</span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <ResetButton />
        <LogoutButton />
      </div>
    </div>
  );
}

/**
 * Dense, Linear-style operator workspace chrome (Agent + Ops). Renders dark via
 * data-theme — the striking contrast with the light customer/Orbit surfaces.
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

  return (
    <div data-theme="dark" className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop rail */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="px-4 py-4">
          <Brand tagline={tagline} />
        </div>
        <NavLinks nav={nav} pathname={pathname} />
        <Identity operator={operator} />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-3 py-2.5 md:px-5">
          <div className="flex items-center gap-2">
            {/* Mobile nav */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Open navigation"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" title="Navigation">
                <div data-theme="dark" className="flex h-full flex-col bg-surface">
                  <div className="px-4 py-4">
                    <Brand tagline={tagline} />
                  </div>
                  <SheetClose asChild>
                    <div className="contents">
                      <NavLinks nav={nav} pathname={pathname} />
                    </div>
                  </SheetClose>
                  <Identity operator={operator} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden w-72 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted sm:flex">
              <Search className="h-4 w-4" />
              <span className="flex-1 truncate">Search…</span>
              <kbd className="rounded border border-border bg-surface px-1.5 font-mono text-[10px] text-muted">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted lg:inline">Viewing as</span>
            <RoleSwitcher />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
