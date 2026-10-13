import TableSkeleton from "@/components/common/TableSkeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="h-24 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-2xl w-full" />

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5"
          />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <TableSkeleton rows={5} />
    </div>
  );
}