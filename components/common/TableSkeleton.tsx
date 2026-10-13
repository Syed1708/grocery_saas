export default function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Top Filter Bar Skeleton */}
      <div className="h-14 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-2xl w-full" />

      {/* Table Shell Skeleton */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden p-4 space-y-3">
        {/* Table Header */}
        <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-full" />

        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-10 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl w-full"
          />
        ))}

        {/* Pagination Skeleton */}
        <div className="h-10 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl w-full mt-4" />
      </div>
    </div>
  );
}