import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { importArticles } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Split pasted Markdown into articles at H1 (`# `) headings. With no heading,
// the first non-empty line becomes the title and the rest the body.
function parseMarkdown(md: string, defaultCategory?: string) {
  const text = md.replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const sections: { title: string; body: string[] }[] = [];
  let current: { title: string; body: string[] } | null = null;
  for (const line of text.split("\n")) {
    const h1 = line.match(/^#\s+(.+)/);
    if (h1) {
      if (current) sections.push(current);
      current = { title: h1[1].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    } else {
      current = { title: "", body: [line] };
    }
  }
  if (current) sections.push(current);

  return sections
    .map((s) => {
      let title = s.title;
      let bodyLines = s.body;
      if (!title) {
        const idx = bodyLines.findIndex((l) => l.trim());
        if (idx >= 0) {
          title = bodyLines[idx].replace(/^#+\s*/, "").trim();
          bodyLines = bodyLines.slice(idx + 1);
        }
      }
      return { title, body: bodyLines.join("\n").trim(), category: defaultCategory };
    })
    .filter((s) => s.title && s.body);
}

export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth || auth.role !== "admin" || !auth.orgId) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }
  let markdown: string | undefined;
  let category: string | undefined;
  try {
    ({ markdown, category } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!markdown || typeof markdown !== "string" || !markdown.trim()) {
    return Response.json({ error: "Paste some Markdown to import" }, { status: 400 });
  }
  const articles = parseMarkdown(markdown, category?.trim() || undefined);
  if (!articles.length) {
    return Response.json({ error: "Couldn't find an article — add a title line" }, { status: 400 });
  }
  try {
    const count = await importArticles(auth.orgId, articles);
    return Response.json({ ok: true, count });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Import failed" }, { status: 500 });
  }
}
