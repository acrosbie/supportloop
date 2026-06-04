import OperatorShell, { type OperatorNavItem } from "@/components/operator/OperatorShell";

const NAV: OperatorNavItem[] = [
  { href: "/agent", label: "Inbox", hint: "Tickets + AI assist", exact: true },
  { href: "/agent/knowledge", label: "Knowledge Loop", hint: "Tickets → articles" },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <OperatorShell
      tagline="Agent Workspace"
      operator={{ name: "Maya Chen", role: "Support Agent" }}
      nav={NAV}
    >
      {children}
    </OperatorShell>
  );
}
