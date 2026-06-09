import { notFound } from "next/navigation";
import { getOrgBySlug, getOrgSettings, accentVars } from "@/lib/org";
import { getPublishedArticles } from "@/lib/data";
import HelpSearch from "@/components/customer/HelpSearch";
import ChatWidget from "@/components/customer/ChatWidget";

export const dynamic = "force-dynamic";

// Public, branded, per-workspace help center. Each org gets its own at /help/<slug>.
export default async function HostedHelpCenter({ params }: { params: { slug: string } }) {
  const org = await getOrgBySlug(params.slug);
  if (!org) notFound();
  const [articles, settings] = await Promise.all([getPublishedArticles(org.id), getOrgSettings(org.id)]);
  const lite = articles.map((a) => ({ id: a.id, title: a.title, category: a.category, tags: a.tags }));

  return (
    <div className="flex min-h-screen flex-col bg-white" style={accentVars(settings.accent)}>
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

      <main className="flex-1">
        <HelpSearch
          articles={lite}
          articleBase={`/help/${org.slug}/article`}
          title="How can we help?"
          subtitle={settings.tagline || `Search ${org.name}'s help center, or ask the assistant in the bottom-right corner.`}
        />
      </main>

      {settings.assistant !== false && (
        <ChatWidget orgSlug={org.slug} orgName={org.name} liveChat={settings.liveChat !== false} />
      )}

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-2 px-6 py-8 text-xs text-muted sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} {org.name}
          </span>
          <a href="/" className="hover:text-foreground">
            Powered by SupportLoop
          </a>
        </div>
      </footer>
    </div>
  );
}
