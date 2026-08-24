// -----------------------------------------------------------------------------
// Badge-Komponente für Status-Anzeigen (Bewerbungsstatus, Unternehmensstatus...)
// Tailwind benötigt literale Klassennamen (kein dynamisches String-Building),
// daher wird jede Farbe explizit als Klassen-Set hinterlegt.
// -----------------------------------------------------------------------------
import { cn } from "@/lib/utils";

const COLOR_CLASSES: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  green: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  gray: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        COLOR_CLASSES[color] ?? COLOR_CLASSES.slate,
        className,
      )}
    >
      {children}
    </span>
  );
}
