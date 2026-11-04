"use client";

// -----------------------------------------------------------------------------
// Filterleiste der Excel-Tabellenansicht (Suche, Status, Portal, Sortierung,
// Wiedervorlage, Spalten-Auswahl) inklusive gespeicherter Ansichten.
// Ausgelagert aus excel-grid-table.tsx.
// -----------------------------------------------------------------------------
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { APPLICATION_STATUSES, JOB_PORTALS } from "@/lib/core/constants";
import { cn } from "@/lib/core/utils";
import type { ApplicationSortOption, ApplicationStatusCounts } from "@/lib/applications/applicationQuery";
import type { SavedFilterValues } from "@/lib/applications/savedFilters";
import type { VisibleColumns } from "@/lib/applications/excelGrid";
import { SavedFiltersBar } from "@/components/applications/saved-filters-bar";
import { ExcelColumnPicker } from "@/components/excel/excel-column-picker";

type Props = {
  searchQuery: string;
  statusFilter: string;
  portalFilter: string;
  onlyFollowUps: boolean;
  sortBy: ApplicationSortOption;
  hasActiveFilters: boolean;
  /** Facet-Counts über alle Bewerbungen; `undefined` bis zum ersten Laden. */
  statusCounts: ApplicationStatusCounts | undefined;
  loadedCount: number;
  total: number;
  hasMoreRows: boolean;
  visibleCols: VisibleColumns;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPortalChange: (value: string) => void;
  onSortChange: (value: ApplicationSortOption) => void;
  onToggleFollowUps: () => void;
  onReset: () => void;
  onApplyPreset: (preset: SavedFilterValues) => void;
  onToggleColumn: (key: keyof VisibleColumns) => void;
  onColumnPreset: (preset: "ALL" | "COMPACT" | "CONTACTS") => void;
};

export function ExcelFilterBar({
  searchQuery,
  statusFilter,
  portalFilter,
  onlyFollowUps,
  sortBy,
  hasActiveFilters,
  statusCounts,
  loadedCount,
  total,
  hasMoreRows,
  visibleCols,
  onSearchChange,
  onStatusChange,
  onPortalChange,
  onSortChange,
  onToggleFollowUps,
  onReset,
  onApplyPreset,
  onToggleColumn,
  onColumnPreset,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-border/60">
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            aria-label="Tabelle durchsuchen"
            placeholder="In Tabelle suchen …"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Suche zurücksetzen"
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <Select
          aria-label="Nach Status filtern"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-8 w-auto text-xs"
        >
          {/* Zähler kommen aus dem Facet-Counts-Endpoint (über alle
              Bewerbungen, nicht nur die aktuell geladene Seite) — bis zum
              ersten Laden wird kein Zähler angezeigt statt eines
              irreführenden 0. */}
          <option value="ALL">Alle Status{statusCounts ? ` (${statusCounts.total})` : ""}</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
              {statusCounts ? ` (${statusCounts.byStatus[s.value] ?? 0})` : ""}
            </option>
          ))}
        </Select>

        {/* Portal Filter */}
        <Select
          aria-label="Nach Portal filtern"
          value={portalFilter}
          onChange={(e) => onPortalChange(e.target.value)}
          className="h-8 w-auto text-xs"
        >
          <option value="ALL">Alle Portale</option>
          {JOB_PORTALS.map((p) => (
            <option key={p.value} value={p.label}>
              {p.label}
            </option>
          ))}
        </Select>

        {/* Sortierung */}
        <Select
          aria-label="Sortierung"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as ApplicationSortOption)}
          className="h-8 w-auto text-xs"
        >
          <option value="DATE_DESC">Datum (Neueste zuerst)</option>
          <option value="DATE_ASC">Datum (Älteste zuerst)</option>
          <option value="COMPANY_ASC">Unternehmen (A–Z)</option>
          <option value="STATUS">Nach Status</option>
        </Select>

        {/* Nur Wiedervorlage */}
        <button
          type="button"
          onClick={onToggleFollowUps}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
            onlyFollowUps
              ? "border-primary bg-primary-soft text-primary font-semibold"
              : "border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-3 w-3" />
          <span>Nur Wiedervorlage</span>
        </button>

        <ExcelColumnPicker visibleCols={visibleCols} onToggle={onToggleColumn} onPreset={onColumnPreset} />

        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={onReset} className="h-8 text-xs text-muted-foreground hover:text-danger">
            <X className="h-3.5 w-3.5" /> Filter zurücksetzen
          </Button>
        )}

        <span className="ml-auto text-[11px] text-muted-foreground">
          {loadedCount} geladene Zeile{loadedCount === 1 ? "" : "n"}
          {hasMoreRows && ` (insgesamt ${total} Treffer)`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Ansichten
        </span>
        <SavedFiltersBar
          currentFilters={{
            status: statusFilter,
            portal: portalFilter,
            search: searchQuery,
            onlyFollowUps,
            sortBy,
          }}
          onApply={onApplyPreset}
        />
      </div>
    </>
  );
}
