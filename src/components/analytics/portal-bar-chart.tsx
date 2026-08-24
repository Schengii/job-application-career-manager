"use client";

// -----------------------------------------------------------------------------
// Horizontales Balkendiagramm: Bewerbungen je Jobportal. Da hier nur EINE
// Kennzahl über mehrere Kategorien verglichen wird (keine zweite codierte
// Variable), genügt ein einzelner Akzentton statt einer kategorialen Palette.
// -----------------------------------------------------------------------------
import { useId } from "react";

type Row = { portal: string; label: string; count: number };

export function PortalBarChart({ data }: { data: Row[] }) {
  const titleId = useId();
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Daten vorhanden.</p>;
  }
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div role="img" aria-labelledby={titleId} className="flex flex-col gap-3">
      <span id={titleId} className="sr-only">
        Anzahl Bewerbungen je Jobportal
      </span>
      {data.map((row) => (
        <div key={row.portal} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">{row.label}</span>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.max((row.count / maxCount) * 100, 4)}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
            {row.count}
          </span>
        </div>
      ))}
    </div>
  );
}
