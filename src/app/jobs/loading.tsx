import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function JobsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-lg" />)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => <SkeletonCard key={i} className="h-44" />)}
      </div>
    </div>
  );
}
