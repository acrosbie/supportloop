"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toaster";

function roleHome(role: string): string {
  if (role === "admin") return "/ops";
  if (role === "agent") return "/agent";
  return "/user";
}

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-2">
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

        {/* Demo logins */}
        <div className="mt-6 space-y-2">
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
              {busy === acc.email ? (
                <span className="text-xs text-muted">…</span>
              ) : (
                <ArrowRight className="h-4 w-4 text-muted" />
              )}
            </button>
          ))}
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          or with email
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Email/password */}
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
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
