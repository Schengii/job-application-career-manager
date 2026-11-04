"use client";

// -----------------------------------------------------------------------------
// Filter- und Suchleiste der Jobliste (Suche, Portal, Match-Score,
// Arbeitsmodell, Sortierung). Ausgelagert aus src/app/jobs/page.tsx.
// -----------------------------------------------------------------------------
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { JOB_PORTALS } from "@/lib/core/constants";
import { hasActiveJobFilters, type JobFilters, type JobSortOption, type JobViewMode } from "@/lib/jobs/jobFilters";

type Props = {
  filters: JobFilters;
  setFilter: <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => void;
  onReset: () => void;
  viewMode: JobViewMode;
  shownCount: number;
  totalCount: number;
};

export function JobFilterBar({ filters, setFilter, onReset, viewMode, shownCount, totalCount }: Props) {
  const active = hasActiveJobFilters(filters);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 glass-card">
      <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Jobtitel, Firma, Tech-Stack suchen …"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilter("search", "")}
              aria-label="Suche zurücksetzen"
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Portal Filter */}
        <Select
          value={filters.portal}
          onChange={(e) => setFilter("portal", e.target.value)}
          className="h-9 w-auto text-xs"
        >
          <option value="ALL">Alle Portale</option>
          {JOB_PORTALS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>

        {/* Match-Score Filter */}
        <Select
          value={filters.match}
          onChange={(e) => setFilter("match", e.target.value)}
          className="h-9 w-auto text-xs"
        >
          <option value="ALL">Jeder Match-Score</option>
          <option value="TOP">Top Matches (≥ 75%)</option>
          <option value="GOOD">Gute Matches (≥ 50%)</option>
        </Select>

        {/* Remote Filter */}
        <Select
          value={filters.remote}
          onChange={(e) => setFilter("remote", e.target.value)}
          className="h-9 w-auto text-xs"
        >
          <option value="ALL">Alle Arbeitsmodelle</option>
          <option value="REMOTE">Nur Remote</option>
          <option value="ONSITE">Vor Ort / Hybrid</option>
        </Select>

        {/* Sortierung */}
        <Select
          value={filters.sortBy}
          onChange={(e) => setFilter("sortBy", e.target.value as JobSortOption)}
          className="h-9 w-auto text-xs"
        >
          <option value="SCORE_DESC">Bester Match zuerst</option>
          <option value="DATE_DESC">Neueste Anzeigen zuerst</option>
          <option value="COMPANY_ASC">Unternehmen (A–Z)</option>
        </Select>

        {active && (
          <Button size="sm" variant="ghost" onClick={onReset} className="h-9 text-xs text-muted-foreground hover:text-danger">
            <X className="h-3.5 w-3.5" /> Filter zurücksetzen
          </Button>
        )}
      </div>

      <span className="text-xs font-semibold text-muted-foreground">
        {shownCount} von {totalCount} Angeboten {viewMode === "DISMISSED" ? "(ausgeblendet)" : ""}
      </span>
    </div>
  );
}
