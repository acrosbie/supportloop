"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Upload, Code2, Users, ArrowRight, Copy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export default function OnboardingWizard({
  orgName,
  slug,
  snippet,
  initialArticleCount,
}: {
  orgName: string;
  slug: string;
  snippet: string;
  initialArticleCount: number;
}) {
  const [md, setMd] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const liveCount = initialArticleCount + importedCount;
  const hasKnowledge = liveCount > 0;

  async function importKb() {
    if (!md.trim()) return;
    setImportBusy(true);
    try {
      const r = await fetch("/api/admin/kb-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markdown: md }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Import failed");
      setImportedCount((c) => c + j.count);
      setMd("");
      toast.success(`Imported ${j.count} article${j.count === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImportBusy(false);
    }
  }

  function copySnippet() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-fg">∞</span>
            <span className="font-semibold tracking-tight">SupportLoop</span>
          </div>
          <Link href="/agent" className="text-sm text-muted hover:text-foreground">
            Skip for now
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to {orgName} 👋</h1>
        <p className="mt-2 text-muted">Three quick steps to get your AI support running.</p>

        <div className="mt-8 space-y-4">
          <Step
            n={1}
            done={hasKnowledge}
            icon={Upload}
            title="Import your knowledge"
            desc="The assistant answers only from your knowledge — give it something to work with."
          >
            <textarea
              value={md}
              onChange={(e) => setMd(e.target.value)}
              rows={5}
              placeholder={"# How do I reset my password?\n\nGo to Settings → Security…\n\n# Where are my invoices?\n\n…"}
              className="field font-mono text-xs"
            />
            <div className="mt-2 flex items-center gap-3">
              <Button size="sm" onClick={importKb} disabled={importBusy || !md.trim()}>
                {importBusy ? "Importing…" : "Import & publish"}
              </Button>
              {hasKnowledge && (
                <span className="text-xs text-success">
                  {liveCount} article{liveCount === 1 ? "" : "s"} live
                </span>
              )}
            </div>
          </Step>

          <Step
            n={2}
            done={false}
            icon={Code2}
            title="Install your chat widget"
            desc="Drop this snippet on your site, or share your hosted help center."
          >
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-surface-2 px-3 py-2 text-xs text-foreground/80">
                {snippet}
              </code>
              <button
                onClick={copySnippet}
                aria-label="Copy snippet"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-xs font-medium hover:border-accent"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <Link href={`/help/${slug}`} className="font-medium text-accent-strong hover:underline">
                Open your help center →
              </Link>
              <Link href={`/widget?org=${slug}`} className="font-medium text-accent-strong hover:underline">
                Preview the widget →
              </Link>
            </div>
          </Step>

          <Step
            n={3}
            done={false}
            icon={Users}
            title="Invite your team"
            desc="Add agents and admins, then route tickets to the right people."
          >
            <Link href="/ops/admin" className="text-sm font-medium text-accent-strong hover:underline">
              Manage your team →
            </Link>
          </Step>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <Button asChild size="lg">
            <Link href="/agent">
              Go to your workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/ops">View your dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  done,
  icon: Icon,
  title,
  desc,
  children,
}: {
  n: number;
  done: boolean;
  icon: LucideIcon;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            done ? "bg-success text-white" : "bg-accent-soft text-accent-strong"
          }`}
        >
          {done ? <Check className="h-4 w-4" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted" />
            <span className="font-medium">{title}</span>
          </div>
          <p className="mt-0.5 text-sm text-muted">{desc}</p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
