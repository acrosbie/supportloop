"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function UserError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <ErrorState
        onRetry={reset}
        className="max-w-md"
        description="Something went wrong loading this page. Please try again — the assistant in the corner can still help."
      />
    </div>
  );
}
