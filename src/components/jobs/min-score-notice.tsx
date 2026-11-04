"use client";

// -----------------------------------------------------------------------------
// Hinweis + Schalter für den Mindest-Match-Score (Preferences.minMatchScore).
// Ausgelagert aus src/app/jobs/page.tsx.
// -----------------------------------------------------------------------------
import { Filter } from "lucide-react";

type Props = {
  minMatchScore: number;
  belowThresholdCount: number;
  respectThreshold: boolean;
  onToggle: () => void;
};

export function MinScoreNotice({ minMatchScore, belowThresholdCount, respectThreshold, onToggle }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary-soft/20 p-3">
      <span className="flex items-center gap-2 text-xs font-medium text-foreground">
        <Filter className="h-3.5 w-3.5 text-primary" />
        Nur Angebote mit Match-Score ≥ {minMatchScore}% werden angezeigt
        {belowThresholdCount > 0 && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
            {belowThresholdCount} unpassende ausgeblendet
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={() => onToggle()}
        className="text-xs font-semibold text-primary hover:underline"
      >
        {respectThreshold ? "Trotzdem alle anzeigen" : "Filter wieder aktivieren"}
      </button>
    </div>
  );
}
