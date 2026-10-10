import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function InterviewPrepLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-32 rounded-lg" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-52" />)}
      </div>
    </div>
  );
}
