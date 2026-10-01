import { Skeleton, SkeletonTableRow } from "@/components/ui/skeleton";

export default function ApplicationsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-lg" />)}
      </div>
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {[...Array(8)].map((_, i) => <SkeletonTableRow key={i} />)}
      </div>
    </div>
  );
}
