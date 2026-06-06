import { notFound } from "next/navigation";
import { getOrgBySlug } from "@/lib/org";
import { getPublishedArticles } from "@/lib/data";
import HelpSearch from "@/components/customer/HelpSearch";
import ChatWidget from "@/components/customer/ChatWidget";

export const dynamic = "force-dynamic";

// Public, branded, per-workspace help center. Each org gets its own at /help/<slug>.
export default async function HostedHelpCenter({ params }: { params: { slug: string } }) {
  const org = await getOrgBySlug(params.slug);
  if (!org) notFound();
  const articles = await getPublishedArticles(org.id);
  const lite = articles.map((a) => ({ id: a.id, title: a.title, category: a.category, tags: a.tags }));

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-fg">
              {org.name.charAt(0).toUpperCase()}
            </span>
            <span className="font-semibold tracking-tight">{org.name} Help Center</span>
          </div>
          <span className="text-xs text-muted">Powered by SupportLoop</span>
        </div>
      </header>

      <section className="bg-gradient-to-b from-accent-soft to-white">
        <div className="mx-auto max-w-3xl px-6 pb-8 pt-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">How can we help?</h1>
          <p className="mt-2 text-muted">
            Search {org.name}&apos;s help center, or ask the AI assistant in the bottom-right corner.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {lite.length > 0 ? (
          <HelpSearch articles={lite} articleBase={`/help/${org.slug}/article`} />
        ) : (
          <p className="text-center text-sm text-muted">
            This help center doesn&apos;t have any published articles yet.
          </p>
        )}
      </div>

      <ChatWidget orgSlug={org.slug} orgName={org.name} />
    </div>
  );
}
