import { SkeletonMetricCard, SkeletonCard } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse-once">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <SkeletonMetricCard key={i} />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-40" />)}
      </div>
      <SkeletonCard className="h-64" />
    </div>
  );
}
