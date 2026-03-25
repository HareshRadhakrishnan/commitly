import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-40 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>

      {/* Before card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <Skeleton className="mb-4 h-3 w-40 rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-4 w-14 shrink-0 rounded" />
              <Skeleton className="h-4 rounded-lg" style={{ width: `${50 + i * 15}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + content */}
      <div className="space-y-4">
        <Skeleton className="h-3 w-44 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 rounded-lg" style={{ width: `${60 + (i % 3) * 15}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
