// -----------------------------------------------------------------------------
// Badge-Komponente für Status-Anzeigen (Bewerbungsstatus, Unternehmensstatus...)
// -----------------------------------------------------------------------------
import { cn } from "@/lib/utils";

const COLOR_CLASSES: Record<string, string> = {
  yellow: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40",
  orange: "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40",
  green: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40",
  red: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40",
  blue: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40",
  amber: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40",
  slate: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/40",
  gray: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/40",
};

export function Badge({
  children,
  color = "slate",
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap shadow-2xs",
        COLOR_CLASSES[color] ?? COLOR_CLASSES.slate,
        className,
      )}
    >
      {children}
    </span>
  );
}
