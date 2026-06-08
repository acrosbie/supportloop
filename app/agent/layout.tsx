import OperatorShell, { type OperatorNavItem } from "@/components/operator/OperatorShell";
import { requireRole } from "@/lib/auth";

const NAV: OperatorNavItem[] = [
  { href: "/agent", label: "Inbox", hint: "Tickets + AI assist", icon: "inbox", exact: true },
  { href: "/agent/customers", label: "Customers", hint: "Accounts + people", icon: "people" },
  { href: "/agent/knowledge", label: "Knowledge Loop", hint: "Tickets → articles", icon: "knowledge" },
];

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(["agent", "admin"]);
  return (
    <OperatorShell
      tagline="Agent Workspace"
      operator={{ name: me.name, role: me.role === "admin" ? "Admin" : "Support Agent" }}
      nav={NAV}
    >
      {children}
    </OperatorShell>
  );
}
