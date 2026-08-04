import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listPosts, formatPostDate } from "@/lib/writing";

export const metadata = {
  title: "Writing",
  description: "Notes on measuring and running AI customer support, from someone who ran it at scale.",
};

export default function WritingIndex() {
  const posts = listPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Writing
      </span>
      <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight tracking-tight">
        Notes on running AI support, not just building it.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
        The parts that are easy to build and hard to get right: what to measure, which numbers survive being
        questioned, and where the usual answers quietly fall apart.
      </p>

      <div className="mt-12 flex flex-col">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/writing/${p.slug}`}
            className="group border-t border-border py-7 transition-colors last:border-b hover:border-border-strong"
          >
            <div className="flex items-center gap-3 text-xs text-muted">
              <time dateTime={p.date}>{formatPostDate(p.date)}</time>
              <span aria-hidden>·</span>
              <span>{p.readingMinutes} min read</span>
            </div>
            <h2 className="mt-2 text-balance text-xl font-semibold tracking-tight group-hover:text-accent-strong">
              {p.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{p.dek}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-strong group-hover:gap-2">
              Read <ArrowRight className="h-4 w-4 transition-all" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
