"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Sign up failed");
      // Establish the session, then go to the customer workspace.
      const sb = createSupabaseBrowser();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      toast.success("Welcome to Orbit");
      router.push("/user");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-fg">∞</span>
          <span className="font-semibold tracking-tight">SupportLoop</span>
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="mt-1 text-sm text-muted">You'll join as a customer of Orbit. No email verification in the demo.</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ characters)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-strong hover:underline">
            Sign in
          </Link>
        </p>
        <Link href="/" className="mt-4 flex items-center justify-center gap-1 text-xs text-muted hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to overview
        </Link>
      </div>
    </div>
  );
}
