import OperatorShell, { type OperatorNavItem } from "@/components/operator/OperatorShell";
import { requirePermission } from "@/lib/auth";

const BASE_NAV: OperatorNavItem[] = [
  { href: "/ops", label: "Dashboard", hint: "Deflection, CSAT, volume", icon: "dashboard", exact: true },
  { href: "/ops/activity", label: "AI activity", hint: "Traces, cost, latency", icon: "activity" },
  { href: "/ops/workflows", label: "Workflows", hint: "Automation", icon: "workflow" },
  { href: "/ops/quality", label: "Quality / Evals", hint: "Grounded-rate", icon: "quality" },
];

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  // Same gate the middleware applies to /ops, repeated here as defense in depth.
  const me = await requirePermission("ops.view");
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
