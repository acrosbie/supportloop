import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TryDocs from "@/components/TryDocs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Try it on your own docs" };

export default function TryPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-fg">
              ∞
            </span>
            <span className="font-semibold tracking-tight">SupportLoop</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Try it on your own docs</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Paste your real help center and ask it anything. This runs the exact grounded-RAG pipeline the product uses —
          it answers from your content or escalates honestly, and never invents.
        </p>
        <div className="mt-8">
          <TryDocs />
        </div>
      </div>
    </div>
  );
}
