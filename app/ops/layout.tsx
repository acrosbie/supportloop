import OperatorShell, { type OperatorNavItem } from "@/components/operator/OperatorShell";
import { requireRole } from "@/lib/auth";

const BASE_NAV: OperatorNavItem[] = [
  { href: "/ops", label: "Dashboard", hint: "Deflection, CSAT, volume", icon: "dashboard", exact: true },
  { href: "/ops/quality", label: "Quality / Evals", hint: "Grounded-rate", icon: "quality" },
];

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(["agent", "admin"]);
  const nav =
    me.role === "admin"
      ? [...BASE_NAV, { href: "/ops/admin", label: "Admin", hint: "Team + KB", icon: "admin" } as OperatorNavItem]
      : BASE_NAV;
  return (
    <OperatorShell
      tagline="Ops & Quality"
      operator={{ name: me.name, role: me.role === "admin" ? "Ops Admin" : "Support Ops" }}
      nav={nav}
    >
      {children}
    </OperatorShell>
  );
}
