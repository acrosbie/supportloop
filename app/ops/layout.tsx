import OperatorShell, { type OperatorNavItem } from "@/components/operator/OperatorShell";

const NAV: OperatorNavItem[] = [
  { href: "/ops", label: "Dashboard", hint: "Deflection, CSAT, volume", exact: true },
  { href: "/ops/quality", label: "Quality / Evals", hint: "Grounded-rate" },
];

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <OperatorShell
      tagline="Ops & Quality"
      operator={{ name: "Dev Patel", role: "Support Ops Lead" }}
      nav={NAV}
    >
      {children}
    </OperatorShell>
  );
}
