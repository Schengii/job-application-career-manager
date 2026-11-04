"use client";

// -----------------------------------------------------------------------------
// Ansicht-Umschalter der Jobliste: Aktive vs. ausgeblendete Angebote.
// Ausgelagert aus src/app/jobs/page.tsx.
// -----------------------------------------------------------------------------
import Link from "next/link";
import { EyeOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/core/utils";
import type { JobViewMode } from "@/lib/jobs/jobFilters";

type Props = {
  viewMode: JobViewMode;
  onChange: (mode: JobViewMode) => void;
  activeCount: number;
  dismissedCount: number;
};

export function JobsViewSwitcher({ viewMode, onChange, activeCount, dismissedCount }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-2">
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-hover/60 border border-border/60">
        <button
          type="button"
          onClick={() => onChange("ACTIVE")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
            viewMode === "ACTIVE"
              ? "bg-surface text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>Aktive Angebote</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px]",
              viewMode === "ACTIVE" ? "bg-primary text-white" : "bg-surface-hover text-muted-foreground"
            )}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange("DISMISSED")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
            viewMode === "DISMISSED"
              ? "bg-surface text-rose-500 shadow-sm ring-1 ring-rose-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <EyeOff className="h-3.5 w-3.5" />
          <span>Ausgeblendete Angebote</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px]",
              viewMode === "DISMISSED" ? "bg-rose-500 text-white" : "bg-surface-hover text-muted-foreground"
            )}
          >
            {dismissedCount}
          </span>
        </button>
      </div>

      {viewMode === "ACTIVE" && dismissedCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 font-medium border border-emerald-500/20">
            <Sparkles className="h-3 w-3" />
            {dismissedCount} unpassende Angebote gefiltert
          </span>
          <Link href="/settings" className="text-primary hover:underline font-medium">
            Blacklist verwalten →
          </Link>
        </div>
      )}
    </div>
  );
}
