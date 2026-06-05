import CustomerShell from "@/components/customer/CustomerShell";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  return <CustomerShell auth={auth ? { name: auth.name } : null}>{children}</CustomerShell>;
}
