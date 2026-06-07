"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, Users, Ticket, Send } from "lucide-react";
import RoleSwitcher from "@/components/RoleSwitcher";
import ChatWidget from "@/components/customer/ChatWidget";
import LogoutButton from "@/components/auth/LogoutButton";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/user", label: "Help Center", icon: LifeBuoy, exact: true },
  { href: "/user/community", label: "Community", icon: Users },
  { href: "/user/new", label: "Submit a request", icon: Send },
];

/** Friendly, refined "Orbit Help Center" chrome — light, the customer face. */
export default function CustomerShell({
  children,
  auth,
}: {
  children: React.ReactNode;
  auth: { name: string } | null;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/user" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg">
              O
            </span>
            <span className="leading-tight">
              <span className="block font-semibold">Orbit</span>
              <span className="block text-xs text-muted">Help Center</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active ? "bg-accent-soft font-medium text-accent-strong" : "text-foreground/70 hover:bg-surface-2"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {auth && (
              <Link
                href="/user/tickets"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                  pathname.startsWith("/user/tickets")
                    ? "bg-accent-soft font-medium text-accent-strong"
                    : "text-foreground/70 hover:bg-surface-2"
                )}
              >
                <Ticket className="h-4 w-4" />
                My tickets
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <RoleSwitcher />
            {auth ? (
              <div className="flex items-center gap-1.5 border-l border-border pl-2">
                <Avatar name={auth.name} className="h-7 w-7 text-[10px]" />
                <LogoutButton />
              </div>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      {/* The assistant follows the customer across every help-center page. */}
      <ChatWidget />

      <footer className="border-t border-border bg-surface-2">
        <div className="mx-auto max-w-5xl px-6 py-5 text-xs text-muted">
          Orbit is a fictional product used to demonstrate{" "}
          <Link href="/" className="text-accent-strong hover:underline">
            SupportLoop
          </Link>
          . No real customers, no real data.
        </div>
      </footer>
    </div>
  );
}
