"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search,
  LayoutGrid,
  LifeBuoy,
  Users,
  Ticket,
  Inbox,
  BookOpen,
  LayoutDashboard,
  FlaskConical,
  ShieldCheck,
  LogIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string;
}

const ITEMS: Item[] = [
  { label: "Overview", href: "/", icon: LayoutGrid, keywords: "home landing" },
  { label: "Help Center", href: "/user", icon: LifeBuoy, keywords: "customer articles kb" },
  { label: "Community", href: "/user/community", icon: Users, keywords: "forum questions" },
  { label: "My Tickets", href: "/user/tickets", icon: Ticket, keywords: "customer" },
  { label: "Agent Inbox", href: "/agent", icon: Inbox, keywords: "queue tickets" },
  { label: "Knowledge Loop", href: "/agent/knowledge", icon: BookOpen, keywords: "kb draft publish" },
  { label: "Ops Dashboard", href: "/ops", icon: LayoutDashboard, keywords: "metrics analytics" },
  { label: "Quality / Evals", href: "/ops/quality", icon: FlaskConical, keywords: "grounded rate" },
  { label: "Admin", href: "/ops/admin", icon: ShieldCheck, keywords: "team roles kb" },
  { label: "Sign in", href: "/login", icon: LogIn, keywords: "log out auth" },
];

export default function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command", onOpen);
    };
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return ITEMS;
    return ITEMS.filter((i) => i.label.toLowerCase().includes(t) || i.keywords?.includes(t));
  }, [q]);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) go(filtered[active].href);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-overlay-in" />
        <Dialog.Content
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[15vh] z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg animate-content-in"
        >
          <Dialog.Title className="sr-only">Command menu</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="h-4 w-4 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Jump to…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
            <kbd className="rounded border border-border bg-surface-2 px-1.5 font-mono text-[10px] text-muted">esc</kbd>
          </div>
          <ul className="max-h-80 overflow-auto p-1">
            {filtered.map((i, idx) => {
              const Icon = i.icon;
              return (
                <li key={i.href}>
                  <button
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(i.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      idx === active ? "bg-accent-soft text-accent-strong" : "text-foreground/80"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {i.label}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
