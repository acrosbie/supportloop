import OperatorShell, { type OperatorNavItem } from "@/components/operator/OperatorShell";
import { requireRole } from "@/lib/auth";

const NAV: OperatorNavItem[] = [
  { href: "/ops", label: "Dashboard", hint: "Deflection, CSAT, volume", icon: "dashboard", exact: true },
  { href: "/ops/quality", label: "Quality / Evals", hint: "Grounded-rate", icon: "quality" },
];

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(["agent", "admin"]);
  return (
    <OperatorShell
      tagline="Ops & Quality"
      operator={{ name: me.name, role: me.role === "admin" ? "Ops Admin" : "Support Ops" }}
      nav={NAV}
    >
      {children}
    </OperatorShell>
  );
}
