"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Plus, Download, Upload, Mail, FileText } from "lucide-react";
import { fetcher } from "@/lib/core/api";
import type { ApplicationListItem } from "@/types";
import type { PaginatedResult } from "@/lib/core/apiUtils";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ApplicationFormDialog, quickUpdateStatus } from "@/components/applications/application-form-dialog";
import { KanbanBoard } from "@/components/applications/kanban-board";
import { useToast } from "@/components/ui/toast";
import { applicationsToCsv, downloadCsv } from "@/lib/core/csv";
import { EmailResponseModal } from "@/components/applications/email-response-modal";
import { ExcelGridTable } from "@/components/excel/excel-grid-table";
import { ExcelImportModal } from "@/components/excel/excel-import-modal";
import { BatchActionBar } from "@/components/applications/batch-action-bar";
import { EigenbemuehungenModal } from "@/components/applications/eigenbemuehungen-modal";
import { ApplicationsToolbar, type ApplicationsViewMode } from "@/components/applications/applications-toolbar";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { useApplicationFilters } from "@/components/applications/use-application-filters";
import { collectTags, filterAndSortApplications } from "@/lib/applications/applicationFilters";

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const { filters, setFilter, resetFilters, applyPreset, setTablePageNum, tableQueryKey } = useApplicationFilters();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [eigenbemuehungenOpen, setEigenbemuehungenOpen] = useState(false);
  const [view, setView] = useState<ApplicationsViewMode>("table");

  // Server-seitige Pagination NUR für die Tabellenansicht (siehe
  // src/lib/applications/applicationQuery.ts) — Kanban bleibt bewusst bei der
  // vollen, ungepaginierten Liste (`applications` oben), damit die Spalten
  // weiterhin alle Bewerbungen zeigen, unabhängig von einer Seite.
  // `null` als Key deaktiviert den Fetch, solange die Tabellenansicht nicht
  // aktiv ist (SWR-Konvention für bedingtes Laden).
  const { data: tablePage, isLoading: isTableLoading } = useSWR<PaginatedResult<ApplicationListItem>>(
    view === "table" ? tableQueryKey : null,
    fetcher
  );
  const tableRows = useMemo(() => tablePage?.data ?? [], [tablePage]);

  // Global listener for shortcut 'N'
  useEffect(() => {
    function handleOpenDialog() {
      setDialogOpen(true);
    }
    window.addEventListener("open-new-application-dialog", handleOpenDialog);
    return () => window.removeEventListener("open-new-application-dialog", handleOpenDialog);
  }, []);

  const availableTags = useMemo(() => collectTags(applications), [applications]);
  const filtered = useMemo(() => filterAndSortApplications(applications, filters), [applications, filters]);

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleSelectAll() {
    // Bezieht sich bewusst nur auf die aktuell sichtbare (Server-)Seite der
    // Tabellenansicht, nicht auf alle Treffer über alle Seiten hinweg — sonst
    // würde "Alle auswählen" Zeilen markieren, die gar nicht sichtbar sind.
    if (selectedIds.length === tableRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tableRows.map((a) => a.id));
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await mutate(
      "/api/applications",
      (current: ApplicationListItem[] | undefined) =>
        current?.map((a) => (a.id === id ? { ...a, status } : a)),
      { revalidate: false }
    );
    try {
      await quickUpdateStatus(id, status);
      await Promise.all([
        mutate("/api/applications"),
        // Die Tabellenansicht liest aus einem eigenen, paginierten/gefilterten
        // SWR-Key (s. tableQueryKey) — der muss nach einem Statuswechsel
        // separat neu geladen werden, sonst zeigt die sichtbare Seite noch
        // den alten Status.
        mutate(tableQueryKey),
        mutate("/api/metrics"),
        mutate("/api/analytics"),
      ]);
      toast.success("Status aktualisiert.");
    } catch {
      toast.error("Status konnte nicht aktualisiert werden.");
      mutate("/api/applications");
      mutate(tableQueryKey);
    }
  }

  function handleExport() {
    if (!filtered.length) {
      toast.error("Keine Bewerbungen zum Exportieren vorhanden.");
      return;
    }
    downloadCsv(`bewerbungen-${new Date().toISOString().slice(0, 10)}.csv`, applicationsToCsv(filtered));
    toast.success("CSV-Export wurde heruntergeladen.");
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bewerbungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Bewerbungen im Überblick mit Stapelverarbeitung, Tags, Filtern und Video-Meeting-Integration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEigenbemuehungenOpen(true)} className="card-hover-effect">
            <FileText className="h-4 w-4 text-primary" /> Nachweis Arbeitsamt (§ 38)
          </Button>
          <Button variant="outline" onClick={() => setImportModalOpen(true)} className="card-hover-effect">
            <Upload className="h-4 w-4" /> Import (.xlsx/.csv)
          </Button>
          <Button variant="outline" onClick={() => setEmailModalOpen(true)} className="card-hover-effect">
            <Mail className="h-4 w-4" /> E-Mail erfassen
          </Button>
          <Button variant="outline" onClick={handleExport} className="card-hover-effect">
            <Download className="h-4 w-4" /> CSV-Export
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="card-hover-effect">
            <Plus className="h-4 w-4" /> Neue Bewerbung (N)
          </Button>
        </div>
      </header>

      <ApplicationsToolbar
        filters={filters}
        setFilter={setFilter}
        onReset={resetFilters}
        onApplyPreset={applyPreset}
        availableTags={availableTags}
        applications={applications}
        view={view}
        onViewChange={setView}
      />

      {view === "excel" ? (
        <ExcelGridTable />
      ) : view === "kanban" ? (
        isLoading ? (
          <p className="text-sm text-muted-foreground">Lade Bewerbungen …</p>
        ) : (
          <KanbanBoard applications={filtered} onStatusChange={handleStatusChange} />
        )
      ) : (
        <>
          <ApplicationsTable
            rows={tableRows}
            loading={isTableLoading}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onStatusChange={handleStatusChange}
          />
          {tablePage && (
            <Pagination
              page={tablePage.page}
              totalPages={tablePage.totalPages}
              total={tablePage.total}
              onPageChange={setTablePageNum}
            />
          )}
        </>
      )}

      {/* Stapelverarbeitungs-Leiste */}
      <BatchActionBar
        selectedIds={selectedIds}
        applications={applications ?? []}
        onClearSelection={() => setSelectedIds([])}
      />

      <ApplicationFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <EmailResponseModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onUpdated={() => {
          mutate("/api/applications");
          mutate("/api/metrics");
        }}
      />
      <ExcelImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          mutate("/api/applications");
          mutate("/api/metrics");
        }}
      />
      <EigenbemuehungenModal
        open={eigenbemuehungenOpen}
        onClose={() => setEigenbemuehungenOpen(false)}
        applications={applications ?? []}
      />
    </div>
  );
}
