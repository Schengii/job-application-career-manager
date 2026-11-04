"use client";

// -----------------------------------------------------------------------------
// Daten- und Filterlogik der Excel-Tabellenansicht: geladene Zeilen, serverseitig
// gefilterte Pagination, Speichern/Löschen/Export und der Filter-Commit mit
// Sicherheitsabfrage bei ungespeicherten Änderungen. Ausgelagert aus
// excel-grid-table.tsx (Code unverändert verschoben).
// -----------------------------------------------------------------------------
import { useState, useMemo, useRef, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher, apiPost, apiDelete } from "@/lib/core/api";
import { useToast } from "@/components/ui/toast";
import type { ApplicationListItem } from "@/types";
import type { PaginatedResult } from "@/lib/core/apiUtils";
import type { ApplicationSortOption, ApplicationStatusCounts } from "@/lib/applications/applicationQuery";
import { applicationsToCsv, downloadCsv } from "@/lib/core/csv";
import type { SavedFilterValues } from "@/lib/applications/savedFilters";
import {
  DEFAULT_FILTERS,
  areFiltersEqual,
  buildFilteredQueryUrl,
  buildStatusCountsQueryUrl,
  sortExcelRows,
  toExcelRow,
  type CommittedFilters,
  type ExcelRow,
} from "@/lib/applications/excelGrid";

// Verzögerung, bevor eine geänderte Volltextsuche einen neuen (paginierten,
// serverseitig gefilterten) Request auslöst — verhindert einen Request pro
// Tastenanschlag. Gleicher Wert wie in use-application-filters.ts.
const SEARCH_DEBOUNCE_MS = 300;

export function useExcelGrid(initialApplications: ApplicationListItem[], initialTotal: number) {
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [rows, setRows] = useState<ExcelRow[]>(() => initialApplications.map(toExcelRow));
  // Gesamtzahl aller Bewerbungen (nicht nur der geladenen) — für die
  // "Weitere laden"-Anzeige und um zu wissen, ob überhaupt noch etwas
  // nachzuladen ist.
  const [total, setTotal] = useState(initialTotal);
  const [loadedPages, setLoadedPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [portalFilter, setPortalFilter] = useState("ALL");
  const [onlyFollowUps, setOnlyFollowUps] = useState(false);
  const [sortBy, setSortBy] = useState<ApplicationSortOption>("DATE_DESC");

  // Filter/Suche laufen serverseitig (siehe src/lib/applicationQuery.ts) —
  // sonst würden Suche/Filter nur die aktuell geladene(n) Seite(n) durchsuchen
  // und echte Treffer auf noch nicht geladenen Seiten verstecken.
  //
  // Der eigentliche Reload wird bewusst NICHT aus einem `useEffect` heraus
  // ausgelöst, der auf die Filter-States "reagiert" — ein Effect, der direkt
  // synchron eine setState-Kette lostritt (Ladeindikator setzen, Zeilen
  // ersetzen), erzeugt unnötige Render-Kaskaden und widerspricht dem in
  // diesem Projekt etablierten Muster (siehe src/app/applications/page.tsx:
  // Datenladen läuft ausschließlich über SWR bzw. direkt aus Event-Handlern,
  // nie aus einem Effect heraus). Stattdessen löst JEDE Filteränderung den
  // Reload direkt aus ihrem jeweiligen Event-Handler aus (s. commitFilterChange
  // unten); nur die Debounce-Verzögerung der Volltextsuche bleibt ein
  // `useEffect`, weil sie an eine Zeitspanne statt an ein konkretes Nutzer-
  // Event gebunden ist — der eigentliche Reload passiert aber auch hier erst
  // im (asynchronen) `setTimeout`-Callback, nicht synchron im Effect-Body.
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Die Filter-Kombination, die tatsächlich in `rows`/`total` widergespiegelt
  // ist (kann von den aktuellen Auswahl-States abweichen, wenn ein Reload
  // wegen ungespeicherter Änderungen abgelehnt wurde, s.u.) — "Weitere laden"
  // baut IMMER auf dieser Referenz auf, damit angehängte Seiten nie zu einer
  // anderen Filterkombination gehören als die bereits geladenen Zeilen.
  const appliedFiltersRef = useRef<CommittedFilters>(DEFAULT_FILTERS);

  // Treibt den Status-Facet-Counts-Request unten an (nur portal/search/
  // onlyFollowUps sind relevant, s. buildStatusCountsQueryUrl) — wird IMMER
  // zusammen mit appliedFiltersRef aktualisiert, also erst NACHDEM ein
  // Filterwechsel tatsächlich angewendet wurde (nicht bei jedem Tastendruck
  // oder bei einer wegen ungespeicherter Änderungen abgelehnten Änderung).
  const [countsFilters, setCountsFilters] = useState<CommittedFilters>(DEFAULT_FILTERS);

  /**
   * Lädt Seite 1 unter den übergebenen Filtern neu und ersetzt die bisher
   * geladenen (gespeicherten) Zeilen damit — ungespeicherte neue Zeilen
   * (`temp-...`) bleiben dabei unberührt erhalten, da Filter auf sie nicht
   * sinnvoll anwendbar sind (sie existieren serverseitig noch gar nicht).
   */
  async function reloadFirstPage(filters: CommittedFilters) {
    setLoadingMore(true);
    try {
      const result = await fetcher<PaginatedResult<ApplicationListItem>>(buildFilteredQueryUrl(1, filters));
      setRows((prev) => {
        const tempRows = prev.filter((r) => r.id.startsWith("temp-"));
        return [...tempRows, ...result.data.map(toExcelRow)];
      });
      setTotal(result.total);
      setLoadedPages(1);
      appliedFiltersRef.current = filters;
      setCountsFilters(filters);
    } catch {
      toast.error("Gefilterte Bewerbungen konnten nicht geladen werden.");
    } finally {
      setLoadingMore(false);
    }
  }

  /**
   * Wendet eine Filteränderung an: no-op, falls sie gegenüber der zuletzt
   * geladenen Kombination nichts ändert; fragt bei ungespeicherten Änderungen
   * an bereits geladenen Zeilen zuerst nach Bestätigung (sonst würden diese
   * beim Neuladen stillschweigend verworfen); lädt sonst Seite 1 neu.
   * Liest `rowsRef.current` statt des `rows`-States direkt, damit auch der
   * verzögerte Aufruf aus dem Such-Debounce (s.u.) immer den aktuellen
   * Bearbeitungsstand sieht, nicht den zum Zeitpunkt des Tastendrucks.
   */
  function commitFilterChange(overrides: Partial<CommittedFilters>) {
    const next: CommittedFilters = { ...appliedFiltersRef.current, ...overrides };
    const applied = appliedFiltersRef.current;
    const unchanged = areFiltersEqual(next, applied);
    if (unchanged) return;

    const hasUnsavedPersistedEdits = rowsRef.current.some((r) => r.isDirty && !r.id.startsWith("temp-"));
    if (
      hasUnsavedPersistedEdits &&
      !confirm(
        "Es gibt ungespeicherte Änderungen an bereits geladenen Zeilen. Beim Filtern werden diese Zeilen neu vom Server geladen — ungespeicherte Änderungen gehen dabei verloren. Trotzdem fortfahren?"
      )
    ) {
      // Auswahl bleibt sichtbar geändert, aber die geladenen Zeilen werden
      // NICHT neu geladen, solange nicht gespeichert oder erneut bestätigt
      // wird — verhindert stillen Datenverlust an unsaved Edits.
      return;
    }

    void reloadFirstPage(next);
  }

  useEffect(() => {
    const timer = setTimeout(() => commitFilterChange({ search: searchQuery }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commitFilterChange liest bewusst nur über Refs (rowsRef/appliedFiltersRef), kein stale-closure-Risiko.
  }, [searchQuery]);

  // Facet-Counts pro Status für die Dropdown-Optionen (s. status-counts/
  // route.ts) — reagiert auf `countsFilters`, das erst NACH einem tatsächlich
  // angewendeten Filterwechsel aktualisiert wird (s. reloadFirstPage). Läuft
  // bewusst über SWR statt über einen manuellen Effect-Aufruf: rein lesend,
  // ohne Risiko für ungespeicherte Änderungen, daher kein commitFilterChange-
  // Gate nötig.
  const { data: statusCounts } = useSWR<ApplicationStatusCounts>(
    buildStatusCountsQueryUrl(countsFilters),
    fetcher
  );

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED">("IDLE");

  // Status/Portal/Suche/Wiedervorlage werden serverseitig gefiltert (s.o.,
  // reloadFirstPage) — `rows` enthält daher bereits nur Treffer (plus
  // ungespeicherte neue Zeilen, die absichtlich NICHT gefiltert werden, s.
  // handleAddRow). Hier bleibt nur noch die client-seitige Sortierung, damit
  // neu hinzugefügte Zeilen sinnvoll einsortiert erscheinen, ohne dafür einen
  // Server-Roundtrip zu brauchen.
  const filteredRows = useMemo(() => sortExcelRows(rows, sortBy), [rows, sortBy]);

  const hasActiveFilters = statusFilter !== "ALL" || portalFilter !== "ALL" || searchQuery.trim() !== "" || onlyFollowUps;

  function resetFilters() {
    setStatusFilter("ALL");
    setPortalFilter("ALL");
    setSearchQuery("");
    setOnlyFollowUps(false);
    commitFilterChange({ status: "ALL", portal: "ALL", search: "", onlyFollowUps: false });
  }

  function changeStatus(value: string) {
    setStatusFilter(value);
    commitFilterChange({ status: value });
  }

  function changePortal(value: string) {
    setPortalFilter(value);
    commitFilterChange({ portal: value });
  }

  function changeSort(value: ApplicationSortOption) {
    setSortBy(value);
    commitFilterChange({ sortBy: value });
  }

  function toggleOnlyFollowUps() {
    const next = !onlyFollowUps;
    setOnlyFollowUps(next);
    commitFilterChange({ onlyFollowUps: next });
  }

  // Die Excel-Ansicht kennt (anders als die klassische Tabellenansicht) keinen
  // Tag-Filter — ein angewendetes Preset mit gesetztem `tag` lässt diesen
  // Bestandteil hier also bewusst unberücksichtigt.
  function handleApplyFilterPreset(preset: SavedFilterValues) {
    setStatusFilter(preset.status);
    setPortalFilter(preset.portal);
    setSearchQuery(preset.search);
    setOnlyFollowUps(preset.onlyFollowUps);
    setSortBy(preset.sortBy as ApplicationSortOption);
    commitFilterChange({
      status: preset.status,
      portal: preset.portal,
      search: preset.search,
      onlyFollowUps: preset.onlyFollowUps,
      sortBy: preset.sortBy as ApplicationSortOption,
    });
  }

  function handleCellChange(id: string, field: keyof ExcelRow, value: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value, isDirty: true };
        }
        return r;
      })
    );
    setSaveStatus("IDLE");
  }

  function handleAddRow() {
    const newId = `temp-${Date.now()}`;
    const newRow: ExcelRow = {
      id: newId,
      companyName: "",
      position: "Frontend Entwickler",
      status: "DRAFT",
      applicationDate: new Date().toISOString().slice(0, 10),
      portal: "Stepstone",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      nextStep: "",
      nextStepDate: "",
      notes: "",
      isDirty: true,
    };
    setRows([newRow, ...rows]);
  }

  async function handleSaveAll() {
    const dirtyRows = rows.filter((r) => r.isDirty && r.companyName.trim());
    if (dirtyRows.length === 0) {
      toast.success("Alle Daten sind bereits auf dem neuesten Stand.");
      return;
    }

    setSaving(true);
    setSaveStatus("SAVING");
    try {
      await apiPost("/api/applications/bulk", { rows: dirtyRows });
      setRows((prev) => prev.map((r) => ({ ...r, isDirty: false })));
      await Promise.all([mutate("/api/applications"), mutate("/api/metrics"), mutate("/api/companies")]);
      setSaveStatus("SAVED");
      toast.success(`${dirtyRows.length} Zeile(n) erfolgreich gespeichert!`);
    } catch {
      toast.error("Fehler beim Speichern der Excel-Tabelle.");
      setSaveStatus("IDLE");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRow(row: ExcelRow) {
    if (row.id.startsWith("temp-")) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }

    if (!confirm(`Möchtest du die Bewerbung bei "${row.companyName}" wirklich löschen?`)) return;

    try {
      await apiDelete(`/api/applications/${row.id}`);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      await Promise.all([mutate("/api/applications"), mutate("/api/metrics")]);
      toast.success("Bewerbung gelöscht.");
    } catch {
      toast.error("Löschen fehlgeschlagen.");
    }
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const nextPage = loadedPages + 1;
      // Baut IMMER auf der zuletzt tatsächlich angewendeten Filterkombination
      // auf (nicht auf den evtl. noch ungespeichert geänderten Auswahl-States,
      // s. appliedFiltersRef oben) — sonst könnten Zeilen zweier
      // unterschiedlicher Filterkombinationen im selben Grid landen.
      const result = await fetcher<PaginatedResult<ApplicationListItem>>(
        buildFilteredQueryUrl(nextPage, appliedFiltersRef.current)
      );
      setRows((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newRows = result.data.filter((app) => !existingIds.has(app.id)).map(toExcelRow);
        return [...prev, ...newRows];
      });
      setTotal(result.total);
      setLoadedPages(nextPage);
    } catch {
      toast.error("Weitere Zeilen konnten nicht geladen werden.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleExportCsv() {
    // Exportiert bewusst ALLE Bewerbungen (nicht nur die aktuell geladenen
    // Grid-Zeilen) — dafür ein frischer, ungepaginierter Fetch beim Klick,
    // statt die komplette Liste schon beim Öffnen der Ansicht laden zu müssen.
    setExportingAll(true);
    try {
      const all = await fetcher<ApplicationListItem[]>("/api/applications");
      if (!all.length) {
        toast.error("Keine Bewerbungen zum Exportieren vorhanden.");
        return;
      }
      downloadCsv(`bewerbungsliste-excel-${new Date().toISOString().slice(0, 10)}.csv`, applicationsToCsv(all));
      toast.success("Tabelle als CSV/Excel exportiert.");
    } catch {
      toast.error("Export fehlgeschlagen.");
    } finally {
      setExportingAll(false);
    }
  }

  const dirtyCount = rows.filter((r) => r.isDirty).length;
  // Nur bereits gespeicherte (vom Server geladene) Zeilen zählen für den
  // "gibt es noch mehr?"-Vergleich mit `total` — unsaved neue Zeilen
  // (`temp-...`, s. handleAddRow) existieren serverseitig noch nicht und
  // würden sonst `hasMoreRows` verfälschen (z.B. fälschlich auf `false`
  // setzen, obwohl serverseitig noch weitere Seiten offen sind).
  const persistedRowCount = rows.filter((r) => !r.id.startsWith("temp-")).length;
  const hasMoreRows = persistedRowCount < total;

  return {
    rows,
    total,
    loadingMore,
    exportingAll,
    saving,
    saveStatus,
    filteredRows,
    statusCounts,
    searchQuery,
    statusFilter,
    portalFilter,
    onlyFollowUps,
    sortBy,
    hasActiveFilters,
    setSearchQuery,
    changeStatus,
    changePortal,
    changeSort,
    toggleOnlyFollowUps,
    resetFilters,
    handleApplyFilterPreset,
    handleCellChange,
    handleAddRow,
    handleSaveAll,
    handleDeleteRow,
    handleLoadMore,
    handleExportCsv,
    dirtyCount,
    persistedRowCount,
    hasMoreRows,
  };
}
