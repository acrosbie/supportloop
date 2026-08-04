import fs from "node:fs";
import path from "node:path";

/**
 * Long-form writing, rendered from the markdown that already lives in docs/.
 *
 * The repo file is the single source: the site reads it rather than keeping a
 * second copy, so the published page can never drift from the version a reader
 * finds on GitHub. Metadata lives here instead of in frontmatter to avoid a
 * parser dependency for what is currently a handful of pieces.
 */
export interface Post {
  slug: string;
  /** Source file under docs/. */
  file: string;
  title: string;
  /** Standfirst shown under the title and on the index. */
  dek: string;
  /** ISO date, used for ordering and display. */
  date: string;
  readingMinutes: number;
}

export const POSTS: Post[] = [
  {
    slug: "measuring-deflection",
    file: "measuring-deflection.md",
    title: "Measuring deflection without fooling yourself",
    dek: "Every AI support vendor quotes a deflection number. Very few of them will tell you the denominator, and that is not an accident.",
    date: "2026-08-03",
    readingMinutes: 7,
  },
];

export function getPost(slug: string): Post | null {
  return POSTS.find((p) => p.slug === slug) ?? null;
}

export function listPosts(): Post[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * The markdown body, with the pieces the page renders itself removed: the H1
 * (the page has its own masthead), the standfirst that follows it, and the
 * trailing byline rule. Read at build time, so the docs file ships baked in.
 */
export function readPostBody(post: Post): string {
  const raw = fs.readFileSync(path.join(process.cwd(), "docs", post.file), "utf8");
  const lines = raw.split(/\r?\n/);

  // Drop the leading H1 and everything up to the first blank line after it.
  let start = 0;
  if (lines[0]?.startsWith("# ")) {
    start = 1;
    while (start < lines.length && lines[start].trim() === "") start++;
    // The paragraph directly under the H1 is the dek, already shown above.
    while (start < lines.length && lines[start].trim() !== "") start++;
  }

  let body = lines.slice(start).join("\n").trim();

  // Trailing "---" + italic byline is a GitHub-reading affordance; the page
  // has a real footer instead.
  body = body.replace(/\n---\n+\*[^*]*\*\s*$/, "").trim();

  return body;
}

export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
