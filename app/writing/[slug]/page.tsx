import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { Button } from "@/components/ui/button";
import { POSTS, getPost, readPostBody, formatPostDate } from "@/lib/writing";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.dek };
}

export default function WritingPost({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();
  const body = readPostBody(post);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex flex-col gap-5 border-b border-border-strong pb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-[1.12] tracking-tight sm:text-[2.75rem]">
          {post.title}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted">{post.dek}</p>
        {/* Just the name: the opening paragraph carries the credential, and the
            markdown has to state it there anyway to stand alone on GitHub. */}
        <p className="text-sm text-muted">
          <span className="font-medium text-foreground">Aidan Crosbie</span>
        </p>
      </header>

      <div className="mt-10">
        <Markdown className="prose-article">{body}</Markdown>
      </div>

      <div className="mt-14 flex flex-col gap-4 border-t border-border pt-8">
        <p className="text-sm leading-relaxed text-muted">
          The implementation is open source in SupportLoop, alongside the rest of the platform: grounded RAG
          with an escalation guardrail, an eval harness, and the operator analytics.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              Open the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://github.com/acrosbie/supportloop" target="_blank" rel="noreferrer">
              Read the source
            </a>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/writing">All writing</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
