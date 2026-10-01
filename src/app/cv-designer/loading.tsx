import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function CvDesignerLoading() {
  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      <div className="w-80 shrink-0 space-y-3">
        <Skeleton className="h-9 w-full rounded-lg" />
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
      </div>
      <div className="flex-1 rounded-xl border border-border bg-surface">
        <div className="h-full flex items-center justify-center">
          <div className="space-y-4 w-2/3">
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
