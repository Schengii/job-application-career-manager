import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function CompaniesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} className="h-36" />)}
      </div>
    </div>
  );
}
