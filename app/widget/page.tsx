import { notFound } from "next/navigation";
import { getOrgBySlug } from "@/lib/org";
import WidgetChat from "@/components/widget/WidgetChat";

export const dynamic = "force-dynamic";

// Standalone, iframe-embeddable chat for one workspace (?org=<slug>).
export default async function WidgetPage({ searchParams }: { searchParams: { org?: string } }) {
  const slug = searchParams.org;
  if (!slug) notFound();
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  return <WidgetChat orgName={org.name} orgSlug={org.slug} />;
}
