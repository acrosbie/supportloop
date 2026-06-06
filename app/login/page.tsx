"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { DEMO_ACCOUNTS, SUPPORTLOOP_ACCOUNTS } from "@/lib/demo-accounts";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toaster";

function roleHome(role: string): string {
  if (role === "admin") return "/ops";
  if (role === "agent") return "/agent";
  return "/user";
}

const BULLETS = [
  "Self-service that deflects routine questions — or escalates",
  "AI triage, sentiment, and grounded agent drafts",
  "Knowledge that writes itself from resolved tickets",
  "Ops analytics that prove it moved a metric",
];

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const denied = params.get("denied");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function doSignIn(em: string, pw: string) {
    setBusy(em);
    const sb = createSupabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email: em, password: pw });
    if (error) {
      toast.error(error.message);
      setBusy(null);
      return;
    }
    const {
      data: { user },
    } = await sb.auth.getUser();
    const role = (user?.app_metadata?.role as string) || "customer";
    router.push(next || roleHome(role));
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-accent-strong to-accent p-12 text-accent-fg lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-base font-bold">∞</span>
          <span className="font-semibold">SupportLoop</span>
        </Link>
        <div className="max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">AI customer support, as a closed loop.</h2>
          <ul className="mt-8 space-y-3 text-sm">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-accent-fg/90">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-accent-fg/70">A demonstration over a fictional product, Orbit.</div>
      </div>

      {/* Form */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-fg">∞</span>
            <span className="font-semibold tracking-tight">SupportLoop</span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Use a one-click demo account, or your own.</p>

          {denied && (
            <div className="mt-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
              That area needs a different role. Try the Agent or Admin demo login.
            </div>
          )}

          <div className="mb-2 mt-6 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
            Orbit demo · one-click
            <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] normal-case text-accent-strong">
              no password — click to enter
            </span>
          </div>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => doSignIn(acc.email, acc.password)}
                disabled={busy !== null}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-accent disabled:opacity-60"
              >
                <Avatar name={acc.name} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {acc.name} <span className="font-normal capitalize text-muted">· {acc.role}</span>
                  </span>
                  <span className="block truncate text-xs text-muted">{acc.blurb}</span>
                </span>
                {busy === acc.email ? <span className="text-xs text-muted">…</span> : <ArrowRight className="h-4 w-4 text-muted" />}
              </button>
            ))}
          </div>

          <div className="mb-2 mt-5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
            Dogfood
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] normal-case text-muted">
              SupportLoop, running on SupportLoop
            </span>
          </div>
          <div className="space-y-2">
            {SUPPORTLOOP_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => doSignIn(acc.email, acc.password)}
                disabled={busy !== null}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-accent disabled:opacity-60"
              >
                <Avatar name={acc.name} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {acc.name} <span className="font-normal capitalize text-muted">· {acc.role}</span>
                  </span>
                  <span className="block truncate text-xs text-muted">{acc.blurb}</span>
                </span>
                {busy === acc.email ? <span className="text-xs text-muted">…</span> : <ArrowRight className="h-4 w-4 text-muted" />}
              </button>
            ))}
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            or with email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              doSignIn(email, password);
            }}
            className="space-y-3"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <Button type="submit" className="w-full" disabled={busy !== null}>
              {busy === email ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            New here?{" "}
            <Link href="/signup" className="font-medium text-accent-strong hover:underline">
              Create an account
            </Link>
          </p>
          <Link href="/" className="mt-4 flex items-center justify-center gap-1 text-xs text-muted hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
