"use client";

// -----------------------------------------------------------------------------
// Horizontales Balkendiagramm für die Bewerbungsstatus-Verteilung.
// Jede Kategorie ist direkt beschriftet (Label + Zahl), Farbe entspricht 1:1
// den Status-Badges, die überall sonst in der App verwendet werden – Identität
// ist also nie allein über Farbe codiert.
// -----------------------------------------------------------------------------
import { useId, useState } from "react";

// Feste Farbzuordnung je Status (entspricht den Badge-Farbtokens aus constants.ts)
const COLOR_HEX: Record<string, string> = {
  slate: "#64748b",
  yellow: "#f59e0b",
  amber: "#f59e0b",
  orange: "#ea580c",
  blue: "#0ea5e9",
  green: "#10b981",
  red: "#ef4444",
  gray: "#6b7280",
};

type Row = { status: string; label: string; color: string; count: number };

export function StatusBarChart({ data }: { data: Row[] }) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const [hovered, setHovered] = useState<string | null>(null);
  const titleId = useId();

  return (
    <div role="img" aria-labelledby={titleId} className="flex flex-col gap-3">
      <span id={titleId} className="sr-only">
        Anzahl Bewerbungen je Status
      </span>
      {data.map((row) => {
        const widthPct = (row.count / maxCount) * 100;
        const isEmpty = row.count === 0;
        return (
          <div
            key={row.status}
            className="flex items-center gap-3"
            onMouseEnter={() => setHovered(row.status)}
            onMouseLeave={() => setHovered((h) => (h === row.status ? null : h))}
          >
            <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">{row.label}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-hover">
              {!isEmpty && (
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${Math.max(widthPct, 4)}%`,
                    backgroundColor: COLOR_HEX[row.color] ?? COLOR_HEX.slate,
                    opacity: hovered && hovered !== row.status ? 0.55 : 1,
                  }}
                />
              )}
            </div>
            <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
              {row.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
