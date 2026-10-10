import { Skeleton, SkeletonMetricCard, SkeletonCard } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <SkeletonMetricCard key={i} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-56" />)}
      </div>
    </div>
  );
}
