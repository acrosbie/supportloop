"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, User, Video, CreditCard, Calendar, Disc, Shield, Rocket, BookOpen, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleLite {
  id: string;
  title: string;
  category: string;
  tags: string[];
}

const ICONS: Record<string, LucideIcon> = {
  Account: User,
  "Audio & Video": Video,
  "Plans & Billing": CreditCard,
  Meetings: Calendar,
  Recording: Disc,
  "Security & Admin": Shield,
  "Getting Started": Rocket,
};
const iconFor = (cat: string): LucideIcon => ICONS[cat] ?? BookOpen;

export default function HelpSearch({
  articles,
  articleBase = "/user/article",
}: {
  articles: ArticleLite[];
  articleBase?: string;
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
      {/* Search */}
      <div className="mx-auto flex max-w-xl items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
        <Search className="h-4 w-4 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an answer…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      {/* Collections */}
      {!showList && (
        <div className="mt-10">
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
                  <Link href={`${articleBase}/${a.id}`} className="flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-surface-2">
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

      {/* Results */}
      {showList && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-widest text-muted">{category || "Search results"}</div>
            {category && (
              <button
                onClick={() => {
                  setCategory(null);
                  setQuery("");
                }}
                className="text-xs font-medium text-accent-strong hover:underline"
              >
                ← All topics
              </button>
            )}
          </div>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
            {filtered.map((a) => {
              const Icon = iconFor(a.category);
              return (
                <li key={a.id}>
                  <Link href={`${articleBase}/${a.id}`} className="flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-surface-2">
                    <Icon className="h-4 w-4 shrink-0 text-muted" />
                    <span className={cn("min-w-0 flex-1")}>
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
      )}
    </div>
  );
}
