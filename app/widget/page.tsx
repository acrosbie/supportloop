import { notFound } from "next/navigation";
import { getOrgBySlug, getOrgSettings, accentVars } from "@/lib/org";
import WidgetChat from "@/components/widget/WidgetChat";

export const dynamic = "force-dynamic";

// Standalone, iframe-embeddable chat for one workspace (?org=<slug>).
export default async function WidgetPage({ searchParams }: { searchParams: { org?: string } }) {
  const slug = searchParams.org;
  if (!slug) notFound();
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  const settings = await getOrgSettings(org.id);
  return <WidgetChat orgName={org.name} orgSlug={org.slug} accentStyle={accentVars(settings.accent)} />;
}
