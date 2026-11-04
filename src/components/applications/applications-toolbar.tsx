"use client";

// -----------------------------------------------------------------------------
// Filter-/Such-Toolbar der Bewerbungsliste (Suche, Portal/Tag/Sortierung,
// Wiedervorlage, Ansichtswechsel, Status-Chips, gespeicherte Ansichten).
// Ausgelagert aus src/app/applications/page.tsx.
// -----------------------------------------------------------------------------
import {
  Table2,
  LayoutGrid,
  FileSpreadsheet,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { ApplicationListItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/core/utils";
import { APPLICATION_STATUSES, JOB_PORTALS } from "@/lib/core/constants";
import { SavedFiltersBar } from "@/components/applications/saved-filters-bar";
import { hasActiveFilters, type ApplicationFilters } from "@/lib/applications/applicationFilters";
import type { ApplicationSortOption } from "@/lib/applications/applicationQuery";
import type { SavedFilterValues } from "@/lib/applications/savedFilters";

export type ApplicationsViewMode = "table" | "kanban" | "excel";

type Props = {
  filters: ApplicationFilters;
  setFilter: <K extends keyof ApplicationFilters>(key: K, value: ApplicationFilters[K]) => void;
  onReset: () => void;
  onApplyPreset: (preset: SavedFilterValues) => void;
  availableTags: string[];
  /** Ungefilterte Gesamtliste — nur für die Zähler an den Status-Chips. */
  applications: ApplicationListItem[] | undefined;
  view: ApplicationsViewMode;
  onViewChange: (view: ApplicationsViewMode) => void;
};

export function ApplicationsToolbar({
  filters,
  setFilter,
  onReset,
  onApplyPreset,
  availableTags,
  applications,
  view,
  onViewChange,
}: Props) {
  const active = hasActiveFilters(filters);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs glass-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          {/* Freitext-Suche */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Firma, Position, Tag, Notiz suchen …"
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

          {/* Portal-Filter */}
          <Select
            value={filters.portal}
            onChange={(e) => setFilter("portal", e.target.value)}
            className="h-9 w-auto text-xs"
          >
            <option value="ALL">Alle Portale</option>
            {JOB_PORTALS.map((p) => (
              <option key={p.value} value={p.label}>
                {p.label}
              </option>
            ))}
          </Select>

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <Select
              value={filters.tag}
              onChange={(e) => setFilter("tag", e.target.value)}
              className="h-9 w-auto text-xs"
            >
              <option value="ALL">Alle Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </Select>
          )}

          {/* Sortierung */}
          <Select
            value={filters.sortBy}
            onChange={(e) => setFilter("sortBy", e.target.value as ApplicationSortOption)}
            className="h-9 w-auto text-xs"
          >
            <option value="DATE_DESC">Datum (Neueste zuerst)</option>
            <option value="DATE_ASC">Datum (Älteste zuerst)</option>
            <option value="COMPANY_ASC">Unternehmen (A–Z)</option>
            <option value="STATUS">Nach Status</option>
          </Select>

          {/* Nur Wiedervorlage */}
          <button
            type="button"
            onClick={() => setFilter("onlyFollowUps", !filters.onlyFollowUps)}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
              filters.onlyFollowUps
                ? "border-primary bg-primary-soft text-primary font-semibold"
                : "border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Nur Wiedervorlage</span>
          </button>

          {active && (
            <Button size="sm" variant="ghost" onClick={onReset} className="h-9 text-xs text-muted-foreground hover:text-danger">
              <X className="h-3.5 w-3.5" /> Filter zurücksetzen
            </Button>
          )}
        </div>

        {/* Ansichtswechsel (Tabelle / Kanban / Excel) */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1" role="tablist" aria-label="Ansicht wählen">
          <button
            type="button"
            role="tab"
            aria-selected={view === "table"}
            onClick={() => onViewChange("table")}
            aria-label="Tabellenansicht"
            className={cn("flex h-7 w-7 items-center justify-center rounded-md", view === "table" ? "bg-primary-soft text-primary font-semibold" : "text-muted-foreground hover:text-foreground")}
            title="Klassische Tabelle"
          >
            <Table2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "kanban"}
            onClick={() => onViewChange("kanban")}
            aria-label="Kanban-Ansicht"
            className={cn("flex h-7 w-7 items-center justify-center rounded-md", view === "kanban" ? "bg-primary-soft text-primary font-semibold" : "text-muted-foreground hover:text-foreground")}
            title="Kanban Board"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "excel"}
            onClick={() => onViewChange("excel")}
            aria-label="Excel-Tabellenansicht"
            className={cn("flex h-7 w-7 items-center justify-center rounded-md", view === "excel" ? "bg-primary-soft text-primary font-semibold" : "text-muted-foreground hover:text-foreground")}
            title="Excel-Schnellerfassung"
          >
            <FileSpreadsheet className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1" role="tablist" aria-label="Nach Status filtern">
        <FilterChip active={filters.status === "ALL"} onClick={() => setFilter("status", "ALL")}>
          Alle ({applications?.length ?? 0})
        </FilterChip>
        {APPLICATION_STATUSES.map((s) => (
          <FilterChip key={s.value} active={filters.status === s.value} onClick={() => setFilter("status", s.value)}>
            {s.label} ({applications?.filter((a) => a.status === s.value).length ?? 0})
          </FilterChip>
        ))}
      </div>

      {/* Gespeicherte Filter/Ansichten */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Ansichten
        </span>
        <SavedFiltersBar currentFilters={filters} onApply={onApplyPreset} />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary-soft text-primary font-semibold"
          : "border-border bg-surface text-muted-foreground hover:bg-surface-hover"
      )}
    >
      {children}
    </button>
  );
}
