// Seeded demo accounts for one-click login. These exist only in the project's
// own Supabase, so the shared password living in client code is fine.
export const DEMO_PASSWORD = "SupportLoop-demo-2026";

export type Role = "customer" | "agent" | "admin";

export interface DemoAccount {
  email: string;
  password: string;
  role: Role;
  name: string;
  home: string;
  blurb: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "customer@supportloop.demo",
    password: DEMO_PASSWORD,
    role: "customer",
    name: "Jamie Rivera",
    home: "/user",
    blurb: "Browse help, chat with the assistant, track your tickets.",
  },
  {
    email: "agent@supportloop.demo",
    password: DEMO_PASSWORD,
    role: "agent",
    name: "Maya Chen",
    home: "/agent",
    blurb: "Work the ticket inbox with AI triage + grounded drafts.",
  },
  {
    email: "admin@supportloop.demo",
    password: DEMO_PASSWORD,
    role: "admin",
    name: "Dev Patel",
    home: "/ops",
    blurb: "Ops dashboards, quality evals, and admin controls.",
  },
];

// The dogfood org: SupportLoop running its own support on SupportLoop. Lives in
// a separate organization ("supportloop"), so it must be seeded against that org
// — never mixed in with the Orbit demo accounts above.
export const SUPPORTLOOP_ACCOUNTS: DemoAccount[] = [
  {
    email: "founder@supportloop.team",
    password: DEMO_PASSWORD,
    role: "admin",
    name: "Sam Okoye",
    home: "/ops",
    blurb: "SupportLoop's own team — we run our support on SupportLoop.",
  },
];
