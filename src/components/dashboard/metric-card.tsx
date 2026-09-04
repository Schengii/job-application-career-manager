import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/core/utils";

const ACCENT_CLASSES: Record<string, { icon: string; border: string }> = {
  primary: {
    icon: "bg-primary/10 text-primary",
    border: "hover:border-primary/50",
  },
  yellow: {
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    border: "hover:border-amber-500/60 border-l-4 border-l-amber-500",
  },
  warning: {
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    border: "hover:border-amber-500/60 border-l-4 border-l-amber-500",
  },
  orange: {
    icon: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30",
    border: "hover:border-orange-500/60 border-l-4 border-l-orange-500",
  },
  green: {
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    border: "hover:border-emerald-500/60 border-l-4 border-l-emerald-500",
  },
  success: {
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    border: "hover:border-emerald-500/60 border-l-4 border-l-emerald-500",
  },
  red: {
    icon: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
    border: "hover:border-rose-500/60 border-l-4 border-l-rose-500",
  },
  danger: {
    icon: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
    border: "hover:border-rose-500/60 border-l-4 border-l-rose-500",
  },
  blue: {
    icon: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30",
    border: "hover:border-sky-500/60 border-l-4 border-l-sky-500",
  },
  info: {
    icon: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30",
    border: "hover:border-sky-500/60 border-l-4 border-l-sky-500",
  },
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
  const styles = ACCENT_CLASSES[accent] || ACCENT_CLASSES.primary;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5 shadow-xs card-hover-effect animate-scale-in group transition-all",
        styles.border
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110 shadow-2xs",
            styles.icon
          )}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
        {loading ? (
          <span className="inline-block h-8 w-12 animate-pulse rounded bg-surface-hover" />
        ) : (
          value
        )}
      </p>
    </div>
  );
}
