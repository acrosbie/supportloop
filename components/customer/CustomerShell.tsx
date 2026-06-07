"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import ChatWidget from "@/components/customer/ChatWidget";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/user", label: "Help Center", exact: true },
  { href: "/user/community", label: "Community" },
];

function Logo() {
  return (
    <Link href="/user" className="flex items-center gap-2.5">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
        O
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Orbit</span>
    </Link>
  );
}

/** The Orbit Help Center chrome — a clean, real-feeling customer help center. */
export default function CustomerShell({
  children,
  auth,
}: {
  children: React.ReactNode;
  auth: { name: string } | null;
}) {
  const pathname = usePathname();
  const year = new Date().getFullYear();
  const navItems = auth ? [...NAV, { href: "/user/tickets", label: "My requests" }] : NAV;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2 md:gap-8">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" title="Menu">
                <div className="flex h-full flex-col bg-white">
                  <div className="border-b border-border px-5 py-4">
                    <Logo />
                  </div>
                  <nav className="flex-1 space-y-1 px-3 py-4">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className="block rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-surface-2"
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Link
                        href="/user/new"
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-accent-strong hover:bg-surface-2"
                      >
                        Submit a request
                      </Link>
                    </SheetClose>
                  </nav>
                  <div className="border-t border-border p-4">
                    {auth ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                          <Avatar name={auth.name} className="h-7 w-7 text-[10px]" />
                          {auth.name}
                        </span>
                        <LogoutButton />
                      </div>
                    ) : (
                      <Link href="/login" className="text-sm font-medium text-foreground/80 hover:text-foreground">
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Logo />

            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm transition-colors",
                      active ? "font-medium text-foreground" : "text-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {auth && (
                <Link
                  href="/user/tickets"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm transition-colors",
                    pathname.startsWith("/user/tickets") ? "font-medium text-foreground" : "text-muted hover:text-foreground"
                  )}
                >
                  My requests
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/user/new">Submit a request</Link>
            </Button>
            {auth ? (
              <div className="flex items-center gap-2 border-l border-border pl-2.5">
                <Avatar name={auth.name} className="h-7 w-7 text-[10px]" />
                <span className="hidden sm:inline">
                  <LogoutButton />
                </span>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-foreground/80 hover:text-foreground">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      {/* The assistant follows the customer across every help-center page. */}
      <ChatWidget />

      {/* Footer */}
      <footer className="mt-20 border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-fg">
                  O
                </span>
                <span className="font-semibold">Orbit</span>
              </div>
              <p className="mt-3 text-sm text-muted">Meetings, recordings, and collaboration for modern teams.</p>
            </div>
            <div className="flex gap-12 text-sm sm:gap-14">
              <div>
                <div className="font-medium text-foreground">Support</div>
                <ul className="mt-3 space-y-2.5 text-muted">
                  <li>
                    <Link href="/user" className="hover:text-foreground">Help Center</Link>
                  </li>
                  <li>
                    <Link href="/user/community" className="hover:text-foreground">Community</Link>
                  </li>
                  <li>
                    <Link href="/user/new" className="hover:text-foreground">Submit a request</Link>
                  </li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-foreground">Account</div>
                <ul className="mt-3 space-y-2.5 text-muted">
                  <li>
                    <Link href="/user/tickets" className="hover:text-foreground">My requests</Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-foreground">Sign in</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center">
            <span>© {year} Orbit, Inc.</span>
            <Link href="/" className="hover:text-foreground">
              Powered by SupportLoop
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
