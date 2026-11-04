"use client";

// -----------------------------------------------------------------------------
// Interaktive Excel-Tabelle / Grid-Editor für Bewerbungen mit Filtern & Sortierung
// -----------------------------------------------------------------------------
// Aufbau (siehe die jeweiligen Dateien):
//  - use-excel-grid.ts        Daten-/Filterlogik (Pagination, Speichern, Export)
//  - use-visible-columns.ts   sichtbare Spalten (localStorage)
//  - excel-grid-header.tsx    Titel + Aktionen
//  - excel-filter-bar.tsx     Filter, Suche, Spalten-Auswahl, gespeicherte Ansichten
//  - excel-grid-row.tsx       Tabellenkopf + editierbare Zeile
//  - src/lib/applications/excelGrid.ts   reine Logik (URL-Builder, Sortierung, ...)
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { RefreshCw } from "lucide-react";
import { fetcher } from "@/lib/core/api";
import { Button } from "@/components/ui/button";
import type { ApplicationListItem } from "@/types";
import type { PaginatedResult } from "@/lib/core/apiUtils";
import { EXCEL_PAGE_SIZE } from "@/lib/applications/excelGrid";
import { ExcelImportModal } from "@/components/excel/excel-import-modal";
import { ExcelGridHeader } from "@/components/excel/excel-grid-header";
import { ExcelFilterBar } from "@/components/excel/excel-filter-bar";
import { ExcelGridHead, ExcelGridRow } from "@/components/excel/excel-grid-row";
import { useExcelGrid } from "@/components/excel/use-excel-grid";
import { useVisibleColumns } from "@/components/excel/use-visible-columns";

export type { ExcelRow, VisibleColumns } from "@/lib/applications/excelGrid";

export function ExcelGridTable() {
  // Lädt nur die erste Seite (s. EXCEL_PAGE_SIZE) statt aller Bewerbungen auf
  // einmal — weitere Seiten werden bei Bedarf über den "Weitere laden"-Button
  // in ExcelGridContent nachgeladen (siehe handleLoadMore).
  const { data: firstPage, isLoading } = useSWR<PaginatedResult<ApplicationListItem>>(
    `/api/applications?page=1&pageSize=${EXCEL_PAGE_SIZE}`,
    fetcher
  );

  if (isLoading || !firstPage) {
    return (
      <div className="rounded-xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
        Lade Excel-Tabelle …
      </div>
    );
  }

  return <ExcelGridContent initialApplications={firstPage.data} initialTotal={firstPage.total} />;
}

function ExcelGridContent({
  initialApplications,
  initialTotal,
}: {
  initialApplications: ApplicationListItem[];
  initialTotal: number;
}) {
  const { mutate } = useSWRConfig();
  const grid = useExcelGrid(initialApplications, initialTotal);
  const { visibleCols, toggleColumn, applyColumnPreset } = useVisibleColumns();
  const [importModalOpen, setImportModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Tabellen-Toolbar & Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 glass-card">
        <ExcelGridHeader
          dirtyCount={grid.dirtyCount}
          saving={grid.saving}
          saveStatus={grid.saveStatus}
          exportingAll={grid.exportingAll}
          onImport={() => setImportModalOpen(true)}
          onAddRow={grid.handleAddRow}
          onExport={grid.handleExportCsv}
          onSave={grid.handleSaveAll}
        />

        <ExcelFilterBar
          searchQuery={grid.searchQuery}
          statusFilter={grid.statusFilter}
          portalFilter={grid.portalFilter}
          onlyFollowUps={grid.onlyFollowUps}
          sortBy={grid.sortBy}
          hasActiveFilters={grid.hasActiveFilters}
          statusCounts={grid.statusCounts}
          loadedCount={grid.rows.length}
          total={grid.total}
          hasMoreRows={grid.hasMoreRows}
          visibleCols={visibleCols}
          onSearchChange={grid.setSearchQuery}
          onStatusChange={grid.changeStatus}
          onPortalChange={grid.changePortal}
          onSortChange={grid.changeSort}
          onToggleFollowUps={grid.toggleOnlyFollowUps}
          onReset={grid.resetFilters}
          onApplyPreset={grid.handleApplyFilterPreset}
          onToggleColumn={toggleColumn}
          onColumnPreset={applyColumnPreset}
        />
      </div>

      {/* Grid-Tabelle */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="scroll-thin overflow-x-auto max-h-[70vh]">
          <table className="w-full min-w-[900px] text-left text-xs border-collapse">
            <ExcelGridHead visibleCols={visibleCols} />
            <tbody className="divide-y divide-border">
              {grid.filteredRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    Keine Zeilen für die aktuellen Filter gefunden. Klicke auf „+ Neue Zeile“ oder setze die Filter zurück.
                  </td>
                </tr>
              )}
              {grid.filteredRows.map((row, idx) => (
                <ExcelGridRow
                  key={row.id}
                  row={row}
                  index={idx}
                  visibleCols={visibleCols}
                  onCellChange={grid.handleCellChange}
                  onDelete={grid.handleDeleteRow}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {grid.hasMoreRows && (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={grid.handleLoadMore}
            disabled={grid.loadingMore}
            className="card-hover-effect"
          >
            {grid.loadingMore ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            {grid.loadingMore
              ? "Lade …"
              : `Weitere ${Math.min(EXCEL_PAGE_SIZE, grid.total - grid.persistedRowCount)} laden`}
          </Button>
        </div>
      )}

      <ExcelImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => mutate("/api/applications")}
      />
    </div>
  );
}
