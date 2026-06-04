import CustomerShell from "@/components/customer/CustomerShell";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
