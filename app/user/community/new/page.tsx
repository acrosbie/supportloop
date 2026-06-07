import Link from "next/link";
import AskForm from "@/components/customer/AskForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ask the community" };

export default function AskPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/user/community" className="text-sm text-accent-strong hover:underline">
        ← Community
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Ask the community</h1>
      <p className="mt-1 text-muted">
        Post a question for other Orbit users and our team. Our assistant can also suggest an answer from the help
        center.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <AskForm />
      </div>
    </div>
  );
}
