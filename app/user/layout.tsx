import CustomerShell from "@/components/customer/CustomerShell";
import { getAuth } from "@/lib/auth";
import { resolveViewerOrgId, getOrgSettings } from "@/lib/org";

export const dynamic = "force-dynamic";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  const orgId = await resolveViewerOrgId();
  const settings = await getOrgSettings(orgId);
  return (
    <CustomerShell
      auth={auth ? { name: auth.name } : null}
      settings={{ community: settings.community, assistant: settings.assistant, liveChat: settings.liveChat }}
    >
      {children}
    </CustomerShell>
  );
}
