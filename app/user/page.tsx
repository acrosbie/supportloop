import Link from "next/link";
import { getPublishedArticles } from "@/lib/data";
import { resolveViewerOrgId } from "@/lib/org";
import HelpSearch from "@/components/customer/HelpSearch";

export const dynamic = "force-dynamic";

export default async function HelpCenter() {
  const orgId = await resolveViewerOrgId();
  const articles = await getPublishedArticles(orgId);
  const lite = articles.map((a) => ({ id: a.id, title: a.title, category: a.category, tags: a.tags }));

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-b from-accent-soft to-white">
        <div className="mx-auto max-w-3xl px-6 pb-8 pt-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">How can we help?</h1>
          <p className="mt-2 text-muted">
            Search Orbit's help center, or ask the AI assistant in the bottom-right corner.
          </p>
          <Link href="/user/new" className="mt-3 inline-block text-sm font-medium text-accent-strong hover:underline">
            Can&apos;t find an answer? Submit a request →
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <HelpSearch articles={lite} />
      </div>
    </div>
  );
}
