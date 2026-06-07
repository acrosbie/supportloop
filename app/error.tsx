"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <ErrorState onRetry={reset} className="max-w-md" />
    </div>
  );
}
