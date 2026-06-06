import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-white">
      <div className="bg-gradient-to-b from-accent-soft to-white">
        <div className="mx-auto max-w-3xl px-6 pb-8 pt-16 text-center">
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto mt-3 h-4 w-80" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Skeleton className="mx-auto h-12 w-full max-w-xl rounded-xl" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
