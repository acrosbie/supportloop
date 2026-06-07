"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Search,
  User,
  Video,
  CreditCard,
  Calendar,
  Disc,
  Shield,
  Rocket,
  BookOpen,
  ChevronRight,
  Sparkles,
  Settings,
  Users,
  Upload,
  HelpCircle,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ArticleLite {
  id: string;
  title: string;
  category: string;
  tags: string[];
}

const ICONS: Record<string, LucideIcon> = {
  Account: User,
  "Account & Team": Users,
  "Audio & Video": Video,
  "Plans & Billing": CreditCard,
  Billing: CreditCard,
  Meetings: Calendar,
  Recording: Disc,
  "Security & Admin": Shield,
  "Getting Started": Rocket,
  "Knowledge Base": BookOpen,
  "AI & Grounding": Sparkles,
  Operations: Settings,
  Imported: Upload,
  General: HelpCircle,
};
const POOL: LucideIcon[] = [Wrench, HelpCircle, BookOpen, Settings, Sparkles, Shield];
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const iconFor = (cat: string): LucideIcon => ICONS[cat] ?? POOL[hashStr(cat) % POOL.length];

export default function HelpSearch({
  articles,
  articleBase = "/user/article",
  title = "How can we help?",
  subtitle,
  submitHref,
}: {
  articles: ArticleLite[];
  articleBase?: string;
  title?: string;
  subtitle?: string;
  submitHref?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [articles]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category && a.category !== category) return false;
      if (!term) return true;
      return a.title.toLowerCase().includes(term) || a.tags.some((t) => t.toLowerCase().includes(term));
    });
  }, [articles, query, category]);

  const showList = query.trim() !== "" || category !== null;

  return (
    <div>
      {/* Hero with search */}
      <section className="bg-gradient-to-b from-accent-soft to-white">
        <div className="mx-auto max-w-3xl px-6 pb-12 pt-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
          <div className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 shadow-sm focus-within:border-accent">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for an answer…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          {submitHref && (
            <Link href={submitHref} className="mt-4 inline-block text-sm font-medium text-accent-strong hover:underline">
              Can&apos;t find an answer? Submit a request →
            </Link>
          )}
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        {showList ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-widest text-muted">{category || "Search results"}</div>
              <button
                onClick={() => {
                  setCategory(null);
                  setQuery("");
                }}
                className="text-xs font-medium text-accent-strong hover:underline"
              >
                ← All topics
              </button>
            </div>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
              {filtered.map((a) => {
                const Icon = iconFor(a.category);
                return (
                  <li key={a.id}>
                    <Link
                      href={`${articleBase}/${a.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-surface-2"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{a.title}</span>
                        <span className="ml-2 text-xs text-muted">{a.category}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                    </Link>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-muted">
                  No articles match. Try the assistant in the bottom-right.
                </li>
              )}
            </ul>
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-sm text-muted">No articles have been published yet.</p>
        ) : (
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-muted">Browse by topic</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(([name, count]) => {
                const Icon = iconFor(name);
                return (
                  <button
                    key={name}
                    onClick={() => setCategory(name)}
                    className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 text-left transition-colors hover:border-accent"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{name}</span>
                      <span className="block text-xs text-muted">
                        {count} article{count === 1 ? "" : "s"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 text-xs font-medium uppercase tracking-widest text-muted">Popular articles</div>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
              {articles.slice(0, 6).map((a) => {
                const Icon = iconFor(a.category);
                return (
                  <li key={a.id}>
                    <Link
                      href={`${articleBase}/${a.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-surface-2"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{a.title}</span>
                        <span className="ml-2 text-xs text-muted">{a.category}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
