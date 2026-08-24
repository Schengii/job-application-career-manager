import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  suffix,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
        {value}
        {suffix && <span className="ml-1 text-lg font-normal text-muted-foreground">{suffix}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
