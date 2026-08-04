import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shared chrome for the writing surface, matching the marketing pages rather
// than the operator shell: these are read by people arriving from outside.
export default function WritingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-fg">
              ∞
            </span>
            <span className="font-semibold tracking-tight">SupportLoop</span>
          </Link>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/writing">Writing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" /> Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Written by <span className="font-medium text-foreground">Aidan Crosbie</span>
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href="/about" className="hover:text-foreground">
              About this project
            </Link>
            <a
              href="https://github.com/acrosbie/supportloop"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              Source on GitHub
            </a>
            <Link href="/login" className="hover:text-foreground">
              Open the demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
