import { getPublishedArticles } from "@/lib/data";
import { resolveViewerOrgId } from "@/lib/org";
import HelpSearch from "@/components/customer/HelpSearch";

export const dynamic = "force-dynamic";

export default async function HelpCenter() {
  const orgId = await resolveViewerOrgId();
  const articles = await getPublishedArticles(orgId);
  const lite = articles.map((a) => ({ id: a.id, title: a.title, category: a.category, tags: a.tags }));

  return (
    <HelpSearch
      articles={lite}
      title="How can we help?"
      subtitle="Search the Orbit Help Center, ask the assistant, or submit a request."
      submitHref="/user/new"
    />
  );
}
