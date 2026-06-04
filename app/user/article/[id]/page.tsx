import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  if (!article || article.status !== "published") notFound();

  const paragraphs = article.body.split("\n\n");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/user" className="text-sm text-accent-strong hover:underline">
        ← Help Center
      </Link>
      <div className="mt-4 text-xs uppercase tracking-wide text-muted">{article.category}</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{article.title}</h1>

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
