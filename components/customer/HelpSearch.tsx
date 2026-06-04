"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface ArticleLite {
  id: string;
  title: string;
  category: string;
  tags: string[];
}

export default function HelpSearch({ articles }: { articles: ArticleLite[] }) {
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

  return (
    <div>
      {/* Search */}
      <div className="mx-auto flex max-w-xl items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
        <span className="text-muted">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an answer…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      {/* Category filter */}
      <div className="mt-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full border px-3 py-1 text-sm ${
            category === null ? "border-accent bg-accent-soft text-accent-strong" : "border-border text-muted hover:bg-surface-2"
          }`}
        >
          All ({articles.length})
        </button>
        {categories.map(([name, count]) => (
          <button
            key={name}
            onClick={() => setCategory(name)}
            className={`rounded-full border px-3 py-1 text-sm ${
              category === name ? "border-accent bg-accent-soft text-accent-strong" : "border-border text-muted hover:bg-surface-2"
            }`}
          >
            {name} ({count})
          </button>
        ))}
      </div>

      {/* Results */}
      <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-white">
        {filtered.map((a) => (
          <li key={a.id}>
            <Link href={`/user/article/${a.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm hover:bg-surface-2">
              <span>
                <span className="font-medium">{a.title}</span>
                <span className="ml-2 text-xs text-muted">{a.category}</span>
              </span>
              <span className="text-muted">→</span>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-5 py-6 text-center text-sm text-muted">
            No articles match. Try the assistant in the bottom-right instead.
          </li>
        )}
      </ul>
    </div>
  );
}
