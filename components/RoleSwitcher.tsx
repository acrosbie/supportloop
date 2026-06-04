"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROLES = [
  { href: "/", label: "Overview" },
  { href: "/user", label: "Customer" },
  { href: "/agent", label: "Agent" },
  { href: "/ops", label: "Ops" },
];

function currentBase(pathname: string): string {
  if (pathname.startsWith("/user")) return "/user";
  if (pathname.startsWith("/agent")) return "/agent";
  if (pathname.startsWith("/ops")) return "/ops";
  return "/";
}

/**
 * The demo's role lens: present on every page, it navigates between the three
 * role workspaces (and the overview). Each workspace is its own URL space.
 */
export default function RoleSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const base = currentBase(pathname);
  return (
    <div
      className={`inline-flex items-center rounded-lg border border-border bg-surface p-0.5 text-sm ${className}`}
    >
      {ROLES.map((r) => {
        const active = base === r.href;
        return (
          <Link
            key={r.href}
            href={r.href}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              active
                ? "bg-accent font-medium text-accent-fg"
                : "text-muted hover:text-foreground"
            }`}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
