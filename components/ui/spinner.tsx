import { cn } from "@/lib/utils";

/** Inline loading spinner; inherits the current text color. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em]",
        className
      )}
    />
  );
}
