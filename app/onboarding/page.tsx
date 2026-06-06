import { requireRole } from "@/lib/auth";
import { getOrgById } from "@/lib/org";
import { getAllArticles } from "@/lib/data";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up your workspace" };

export default async function OnboardingPage() {
  const me = await requireRole(["admin"]);
  const orgId = me.orgId ?? "";
  const [org, articles] = await Promise.all([getOrgById(orgId), getAllArticles(orgId)]);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const slug = org?.slug ?? "";
  const snippet = `<script src="${siteUrl}/embed.js" data-org="${slug}" async></script>`;

  return (
    <OnboardingWizard
      orgName={org?.name ?? "your workspace"}
      slug={slug}
      snippet={snippet}
      initialArticleCount={articles.length}
    />
  );
}
