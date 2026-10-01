import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-lg" />)}
      </div>
      {[...Array(3)].map((_, i) => (
        <SkeletonCard key={i} className="h-32" />
      ))}
    </div>
  );
}
