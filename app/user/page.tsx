import { getPublishedArticles } from "@/lib/data";
import HelpSearch from "@/components/customer/HelpSearch";
import ChatWidget from "@/components/customer/ChatWidget";

export const dynamic = "force-dynamic";

export default async function HelpCenter() {
  const articles = await getPublishedArticles();
  const lite = articles.map((a) => ({ id: a.id, title: a.title, category: a.category, tags: a.tags }));

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-b from-accent-soft to-white">
        <div className="mx-auto max-w-3xl px-6 pb-8 pt-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">How can we help?</h1>
          <p className="mt-2 text-muted">
            Search Orbit's help center, or ask the AI assistant in the bottom-right corner.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <HelpSearch articles={lite} />
      </div>

      <ChatWidget />
    </div>
  );
}
