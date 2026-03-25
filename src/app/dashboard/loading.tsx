import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* Greeting skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-7 w-48 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />

        {/* Stats row */}
        <div className="mt-5 flex items-center gap-6">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-xl" />
            <Skeleton className="h-1 w-28 rounded-full" />
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28 rounded-lg" />
            <Skeleton className="h-7 w-10 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Connected repos section */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-44 rounded-lg" />
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="space-y-3">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
            <Skeleton className="h-9 w-40 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Recent drafts section */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          >
            <Skeleton className="size-4 shrink-0 rounded" />
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
