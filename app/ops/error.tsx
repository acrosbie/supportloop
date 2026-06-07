"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function OpsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <ErrorState onRetry={reset} className="max-w-md" description="We couldn't load this dashboard. Try again, or reset the demo data." />
    </div>
  );
}
