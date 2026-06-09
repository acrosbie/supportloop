import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getArticle, getPublishedArticles } from "@/lib/data";
import { resolveViewerOrgId } from "@/lib/org";
import { timeAgo } from "@/lib/utils";
import ArticleFeedback from "@/components/customer/ArticleFeedback";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const orgId = await resolveViewerOrgId();
  const article = await getArticle(orgId, params.id);
  if (!article || article.status !== "published") notFound();

  const all = await getPublishedArticles(orgId);
  const related = all.filter((a) => a.category === article.category && a.id !== article.id).slice(0, 4);
  const paragraphs = article.body.split("\n\n");
  const updated = article.published_at ?? article.created_at;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/user" className="hover:text-foreground">
          Help Center
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground/70">{article.category}</span>
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{article.title}</h1>
      <div className="mt-2 text-sm text-muted">Updated {timeAgo(updated)}</div>

      <article className="mt-8 space-y-5 text-base leading-relaxed text-foreground/90">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>

      {article.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
          {article.tags.map((t) => (
            <span key={t} className="rounded-full bg-surface-2 px-3 py-1 text-xs text-foreground/70">
              {t}
            </span>
          ))}
        </div>
      )}

      <ArticleFeedback />

      {related.length > 0 && (
        <div className="mt-10">
          <div className="text-xs font-medium uppercase tracking-widest text-muted">Related articles</div>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
            {related.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/user/article/${a.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 text-[15px] hover:bg-surface-2"
                >
                  <span className="font-medium">{a.title}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <div className="font-medium">Still need help?</div>
        <p className="mt-1 text-sm text-muted">
          Ask the assistant in the bottom-right corner, or open a request and a teammate will follow up.
        </p>
        <Link
          href="/user/new"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-strong hover:underline"
        >
          Submit a request →
        </Link>
      </div>
    </div>
  );
}
