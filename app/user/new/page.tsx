import Link from "next/link";
import { getAuth } from "@/lib/auth";
import NewTicketForm from "@/components/customer/NewTicketForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Submit a request" };

export default async function NewRequest() {
  const auth = await getAuth();
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Submit a request</h1>
      <p className="mt-1 text-muted">
        Tell us what&apos;s going on and we&apos;ll get back to you. Want a quick answer first? Ask the assistant in the
        bottom-right of the{" "}
        <Link href="/user" className="font-medium text-accent-strong hover:underline">
          help center
        </Link>
        .
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <NewTicketForm loggedIn={!!auth} defaultEmail={auth?.email} />
      </div>
    </div>
  );
}
