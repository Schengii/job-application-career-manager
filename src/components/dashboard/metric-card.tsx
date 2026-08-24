import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_CLASSES: Record<string, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  loading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: keyof typeof ACCENT_CLASSES;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs card-hover-effect animate-scale-in">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110", ACCENT_CLASSES[accent])}>
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
        {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-surface-hover" /> : value}
      </p>
    </div>
  );
}
