import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getArticle } from "@/lib/data";
import { resolveViewerOrgId } from "@/lib/org";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const orgId = await resolveViewerOrgId();
  const article = await getArticle(orgId, params.id);
  if (!article || article.status !== "published") notFound();

  const paragraphs = article.body.split("\n\n");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/user" className="hover:text-foreground">
          Help Center
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground/70">{article.category}</span>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{article.title}</h1>

      <article className="mt-6 space-y-4 text-[15px] leading-relaxed text-foreground/90">
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
    </div>
  );
}
