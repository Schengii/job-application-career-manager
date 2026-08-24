"use client";

// -----------------------------------------------------------------------------
// Funnel / Bewerbungstrichter Chart
// -----------------------------------------------------------------------------
// Visualisiert die Conversion-Rate über die 4 Kernphasen des Bewerbungsprozesses.
// -----------------------------------------------------------------------------

import { cn } from "@/lib/utils";

type FunnelStep = {
  stage: string;
  count: number;
  rate: number;
};

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Daten für den Trichter vorhanden.</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex flex-col gap-4 py-2">
      {data.map((step, idx) => {
        const widthPct = Math.max(12, Math.round((step.count / maxCount) * 100));

        return (
          <div key={step.stage} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-foreground flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-hover text-[11px] font-bold text-muted-foreground">
                  {idx + 1}
                </span>
                {step.stage}
              </span>
              <div className="flex items-center gap-2 text-right">
                <span className="font-semibold text-foreground">{step.count}</span>
                <span className="text-muted-foreground text-[11px]">({step.rate}%)</span>
              </div>
            </div>

            <div className="h-6 w-full rounded-md bg-surface-hover/70 overflow-hidden flex items-center p-0.5">
              <div
                className={cn(
                  "h-full rounded transition-all duration-500 shadow-2xs",
                  idx === 0 && "bg-amber-500",
                  idx === 1 && "bg-indigo-500",
                  idx === 2 && "bg-sky-500",
                  idx === 3 && "bg-emerald-500"
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
