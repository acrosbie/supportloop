import OperatorShell, { type OperatorNavItem } from "@/components/operator/OperatorShell";
import { Inbox, BookOpen } from "lucide-react";

const NAV: OperatorNavItem[] = [
  { href: "/agent", label: "Inbox", hint: "Tickets + AI assist", icon: Inbox, exact: true },
  { href: "/agent/knowledge", label: "Knowledge Loop", hint: "Tickets → articles", icon: BookOpen },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <OperatorShell tagline="Agent Workspace" operator={{ name: "Maya Chen", role: "Support Agent" }} nav={NAV}>
      {children}
    </OperatorShell>
  );
}
