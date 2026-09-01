"use client";

// -----------------------------------------------------------------------------
// Interaktive Excel-Tabelle / Grid-Editor für Bewerbungen mit Filtern & Sortierung
// -----------------------------------------------------------------------------
import { useState, useMemo, useRef, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import {
  Plus,
  Save,
  Trash2,
  ArrowUpRight,
  Download,
  Upload,
  Search,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  SlidersHorizontal,
  Columns,
  X,
} from "lucide-react";
import { fetcher, apiPost, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { APPLICATION_STATUSES, JOB_PORTALS } from "@/lib/constants";
import type { ApplicationListItem } from "@/types";
import type { PaginatedResult } from "@/lib/apiUtils";
import type { ApplicationStatusCounts } from "@/lib/applicationQuery";
import { applicationsToCsv, downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { ExcelImportModal } from "@/components/excel/excel-import-modal";
import { SavedFiltersBar } from "@/components/applications/saved-filters-bar";
import type { SavedFilterValues } from "@/lib/savedFilters";

// Seitengröße für den initialen Ladevorgang & jedes weitere "Weitere laden"
// (siehe applyPage()/handleLoadMore unten). Begrenzt die anfänglich geladene
// (und ins DOM gerenderte) Zeilenmenge, statt bei jedem Öffnen der Ansicht
// sofort ALLE Bewerbungen zu laden — nutzt dieselbe Pagination-Infrastruktur
// wie die Tabellenansicht (src/lib/apiUtils.ts).
const EXCEL_PAGE_SIZE = 50;

// Verzögerung, bevor eine geänderte Volltextsuche einen neuen (paginierten,
// serverseitig gefilterten) Request auslöst — verhindert einen Request pro
// Tastenanschlag. Gleicher Wert wie in src/app/applications/page.tsx.
const SEARCH_DEBOUNCE_MS = 300;

export type ExcelRow = {
  id: string;
  companyName: string;
  position: string;
  status: string;
  applicationDate: string; // YYYY-MM-DD
  portal: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  nextStep: string;
  nextStepDate: string;
  notes: string;
  isDirty?: boolean;
};

type SortOption = "DATE_DESC" | "DATE_ASC" | "COMPANY_ASC" | "STATUS";

export type VisibleColumns = {
  date: boolean;
  portal: boolean;
  status: boolean;
  contact: boolean;
  email: boolean;
  followUp: boolean;
  notes: boolean;
  actions: boolean;
};

const DEFAULT_COLUMNS: VisibleColumns = {
  date: true,
  portal: true,
  status: true,
  contact: true,
  email: true,
  followUp: true,
  notes: true,
  actions: true,
};

const COLS_STORAGE_KEY = "career_manager_excel_cols";

type CommittedFilters = {
  status: string;
  portal: string;
  search: string;
  onlyFollowUps: boolean;
  sortBy: SortOption;
};

const DEFAULT_FILTERS: CommittedFilters = {
  status: "ALL",
  portal: "ALL",
  search: "",
  onlyFollowUps: false,
  sortBy: "DATE_DESC",
};

/** Baut die paginierte, serverseitig gefilterte Applications-URL (siehe src/lib/applicationQuery.ts). */
function buildFilteredQueryUrl(page: number, filters: CommittedFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(EXCEL_PAGE_SIZE));
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (filters.portal !== "ALL") params.set("portal", filters.portal);
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.onlyFollowUps) params.set("onlyFollowUps", "true");
  params.set("sortBy", filters.sortBy);
  return `/api/applications?${params.toString()}`;
}

/**
 * Baut die Query-URL für die Status-Facet-Counts (s. status-counts/route.ts)
 * — bewusst OHNE `status` selbst: die Zählung pro Status soll unabhängig von
 * einem ggf. bereits gewählten Status sein (sonst würden die anderen
 * Dropdown-Optionen sofort 0 anzeigen, sobald ein Status ausgewählt ist).
 */
function buildStatusCountsQueryUrl(filters: CommittedFilters): string {
  const params = new URLSearchParams();
  if (filters.portal !== "ALL") params.set("portal", filters.portal);
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.onlyFollowUps) params.set("onlyFollowUps", "true");
  return `/api/applications/status-counts?${params.toString()}`;
}

/** Wandelt ein ApplicationListItem aus der API in eine editierbare Grid-Zeile um. */
function toExcelRow(app: ApplicationListItem): ExcelRow {
  return {
    id: app.id,
    companyName: app.company.name,
    position: app.position,
    status: app.status,
    applicationDate: app.applicationDate ? new Date(app.applicationDate).toISOString().slice(0, 10) : "",
    portal: app.source || app.jobPosting?.portalSource || "",
    contactName: app.company.contactName || "",
    contactEmail: app.company.contactEmail || "",
    contactPhone: app.company.contactPhone || "",
    nextStep: app.nextStep || "",
    nextStepDate: app.nextStepDate ? new Date(app.nextStepDate).toISOString().slice(0, 10) : "",
    notes: app.notes || "",
    isDirty: false,
  };
}

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
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");

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
    const unchanged =
      next.status === applied.status &&
      next.portal === applied.portal &&
      next.search === applied.search &&
      next.onlyFollowUps === applied.onlyFollowUps &&
      next.sortBy === applied.sortBy;
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

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);
  const columnPopoverRef = useRef<HTMLDivElement>(null);

  const [visibleCols, setVisibleCols] = useState<VisibleColumns>(() => {
    if (typeof window === "undefined") return DEFAULT_COLUMNS;
    try {
      const saved = localStorage.getItem(COLS_STORAGE_KEY);
      return saved ? { ...DEFAULT_COLUMNS, ...JSON.parse(saved) } : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  // Click outside for column popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnPopoverRef.current && !columnPopoverRef.current.contains(e.target as Node)) {
        setColumnPopoverOpen(false);
      }
    }
    if (columnPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [columnPopoverOpen]);

  function toggleColumn(key: keyof VisibleColumns) {
    const updated = { ...visibleCols, [key]: !visibleCols[key] };
    setVisibleCols(updated);
    try {
      localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }

  function applyPreset(preset: "ALL" | "COMPACT" | "CONTACTS") {
    let updated: VisibleColumns = { ...DEFAULT_COLUMNS };
    if (preset === "COMPACT") {
      updated = {
        date: true,
        portal: false,
        status: true,
        contact: false,
        email: false,
        followUp: false,
        notes: false,
        actions: true,
      };
    } else if (preset === "CONTACTS") {
      updated = {
        date: false,
        portal: false,
        status: true,
        contact: true,
        email: true,
        followUp: false,
        notes: true,
        actions: true,
      };
    }
    setVisibleCols(updated);
    try {
      localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setColumnPopoverOpen(false);
  }

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED">("IDLE");

  // Status/Portal/Suche/Wiedervorlage werden serverseitig gefiltert (s.o.,
  // reloadFirstPage) — `rows` enthält daher bereits nur Treffer (plus
  // ungespeicherte neue Zeilen, die absichtlich NICHT gefiltert werden, s.
  // handleAddRow). Hier bleibt nur noch die client-seitige Sortierung, damit
  // neu hinzugefügte Zeilen sinnvoll einsortiert erscheinen, ohne dafür einen
  // Server-Roundtrip zu brauchen.
  const filteredRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      if (sortBy === "DATE_DESC") {
        return b.applicationDate.localeCompare(a.applicationDate);
      }
      if (sortBy === "DATE_ASC") {
        return a.applicationDate.localeCompare(b.applicationDate);
      }
      if (sortBy === "COMPANY_ASC") {
        return a.companyName.localeCompare(b.companyName);
      }
      if (sortBy === "STATUS") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
    return list;
  }, [rows, sortBy]);

  const hasActiveFilters = statusFilter !== "ALL" || portalFilter !== "ALL" || searchQuery.trim() !== "" || onlyFollowUps;

  function resetFilters() {
    setStatusFilter("ALL");
    setPortalFilter("ALL");
    setSearchQuery("");
    setOnlyFollowUps(false);
    commitFilterChange({ status: "ALL", portal: "ALL", search: "", onlyFollowUps: false });
  }

  // Die Excel-Ansicht kennt (anders als die klassische Tabellenansicht) keinen
  // Tag-Filter — ein angewendetes Preset mit gesetztem `tag` lässt diesen
  // Bestandteil hier also bewusst unberücksichtigt.
  function handleApplyFilterPreset(preset: SavedFilterValues) {
    setStatusFilter(preset.status);
    setPortalFilter(preset.portal);
    setSearchQuery(preset.search);
    setOnlyFollowUps(preset.onlyFollowUps);
    setSortBy(preset.sortBy as SortOption);
    commitFilterChange({
      status: preset.status,
      portal: preset.portal,
      search: preset.search,
      onlyFollowUps: preset.onlyFollowUps,
      sortBy: preset.sortBy as SortOption,
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

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Tabellen-Toolbar & Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 glass-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Tabellen-Schnellerfassung
                {dirtyCount > 0 && (
                  <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning animate-pulse-subtle">
                    {dirtyCount} ungespeichert
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Zellen wie in Excel bearbeiten, Filter setzen und Tab/Enter zur Navigation nutzen.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setImportModalOpen(true)} className="card-hover-effect">
              <Upload className="h-4 w-4" /> Import (.xlsx/.csv)
            </Button>

            <Button size="sm" variant="outline" onClick={handleAddRow} className="card-hover-effect">
              <Plus className="h-4 w-4" /> Neue Zeile
            </Button>

            <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={exportingAll} className="card-hover-effect">
              {exportingAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export {exportingAll ? "…" : "(alle)"}
            </Button>

            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={saving || dirtyCount === 0}
              className="card-hover-effect relative"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : saveStatus === "SAVED" ? (
                <CheckCircle2 className="h-4 w-4 text-success-foreground" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? "Speichere …" : saveStatus === "SAVED" ? "Gespeichert" : "Speichern"}</span>
            </Button>
          </div>
        </div>

        {/* Filterleiste */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-border/60">
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="In Tabelle suchen …"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
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
            onChange={(e) => {
              setStatusFilter(e.target.value);
              commitFilterChange({ status: e.target.value });
            }}
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
            onChange={(e) => {
              setPortalFilter(e.target.value);
              commitFilterChange({ portal: e.target.value });
            }}
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
            onChange={(e) => {
              setSortBy(e.target.value as SortOption);
              commitFilterChange({ sortBy: e.target.value as SortOption });
            }}
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
            onClick={() => {
              const next = !onlyFollowUps;
              setOnlyFollowUps(next);
              commitFilterChange({ onlyFollowUps: next });
            }}
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

          {/* Spalten-Konfigurator Popover */}
          <div className="relative" ref={columnPopoverRef}>
            <button
              type="button"
              onClick={() => setColumnPopoverOpen(!columnPopoverOpen)}
              className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Spalten ({Object.values(visibleCols).filter(Boolean).length + 2})</span>
            </button>

            {columnPopoverOpen && (
              <div className="absolute right-0 top-9.5 z-50 w-64 rounded-xl border border-border bg-surface p-3.5 shadow-xl animate-scale-in glass-card space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold text-foreground">Spalten anpassen</span>
                  <button
                    type="button"
                    onClick={() => setColumnPopoverOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyPreset("ALL")}
                    className="flex-1 rounded bg-surface-hover py-1 text-[10px] font-semibold text-foreground hover:bg-primary-soft hover:text-primary transition-colors"
                  >
                    Alle
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("COMPACT")}
                    className="flex-1 rounded bg-surface-hover py-1 text-[10px] font-semibold text-foreground hover:bg-primary-soft hover:text-primary transition-colors"
                  >
                    Kompakt
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("CONTACTS")}
                    className="flex-1 rounded bg-surface-hover py-1 text-[10px] font-semibold text-foreground hover:bg-primary-soft hover:text-primary transition-colors"
                  >
                    Kontakte
                  </button>
                </div>

                {/* Checkboxen */}
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.date}
                      onChange={() => toggleColumn("date")}
                      className="rounded border-border text-primary"
                    />
                    <span>Datum</span>
                  </label>
                  <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.portal}
                      onChange={() => toggleColumn("portal")}
                      className="rounded border-border text-primary"
                    />
                    <span>Portal / Quelle</span>
                  </label>
                  <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.status}
                      onChange={() => toggleColumn("status")}
                      className="rounded border-border text-primary"
                    />
                    <span>Status</span>
                  </label>
                  <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.contact}
                      onChange={() => toggleColumn("contact")}
                      className="rounded border-border text-primary"
                    />
                    <span>Ansprechpartner</span>
                  </label>
                  <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.email}
                      onChange={() => toggleColumn("email")}
                      className="rounded border-border text-primary"
                    />
                    <span>E-Mail / Tel</span>
                  </label>
                  <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.followUp}
                      onChange={() => toggleColumn("followUp")}
                      className="rounded border-border text-primary"
                    />
                    <span>Wiedervorlage</span>
                  </label>
                  <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.notes}
                      onChange={() => toggleColumn("notes")}
                      className="rounded border-border text-primary"
                    />
                    <span>Notizen / Anmerkungen</span>
                  </label>
                  <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.actions}
                      onChange={() => toggleColumn("actions")}
                      className="rounded border-border text-primary"
                    />
                    <span>Aktionen</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={resetFilters} className="h-8 text-xs text-muted-foreground hover:text-danger">
              <X className="h-3.5 w-3.5" /> Filter zurücksetzen
            </Button>
          )}

          <span className="ml-auto text-[11px] text-muted-foreground">
            {rows.length} geladene Zeile{rows.length === 1 ? "" : "n"}
            {hasMoreRows && ` (insgesamt ${total} Treffer)`}
          </span>
        </div>

        {/* Gespeicherte Filter/Ansichten */}
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
            onApply={handleApplyFilterPreset}
          />
        </div>
      </div>

      {/* Grid-Tabelle */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="scroll-thin overflow-x-auto max-h-[70vh]">
          <table className="w-full min-w-[900px] text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 border-b border-border bg-surface-hover/90 backdrop-blur-md text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              <tr>
                <th className="w-10 px-3 py-2.5 text-center">#</th>
                <th className="w-48 px-3 py-2.5">Unternehmen *</th>
                <th className="w-48 px-3 py-2.5">Position *</th>
                {visibleCols.date && <th className="w-32 px-3 py-2.5">Datum</th>}
                {visibleCols.portal && <th className="w-36 px-3 py-2.5">Portal</th>}
                {visibleCols.status && <th className="w-36 px-3 py-2.5">Status</th>}
                {visibleCols.contact && <th className="w-40 px-3 py-2.5">Ansprechpartner</th>}
                {visibleCols.email && <th className="w-44 px-3 py-2.5">E-Mail / Tel</th>}
                {visibleCols.followUp && <th className="w-36 px-3 py-2.5">Wiedervorlage</th>}
                {visibleCols.notes && <th className="min-w-[200px] px-3 py-2.5">Notizen / Anmerkungen</th>}
                {visibleCols.actions && <th className="w-16 px-3 py-2.5 text-center">Aktion</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    Keine Zeilen für die aktuellen Filter gefunden. Klicke auf „+ Neue Zeile“ oder setze die Filter zurück.
                  </td>
                </tr>
              )}
              {filteredRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={cn(
                    "group hover:bg-surface-hover/50 transition-colors",
                    row.isDirty && "bg-warning-soft/30",
                    row.status === "SENT" && "border-l-4 border-l-amber-500",
                    row.status === "INTERVIEW" && "border-l-4 border-l-sky-500",
                    row.status === "OFFER" && "border-l-4 border-l-emerald-500",
                    row.status === "REJECTED" && "border-l-4 border-l-rose-500",
                    row.status === "WITHDRAWN" && "border-l-4 border-l-slate-400",
                    row.status === "DRAFT" && "border-l-4 border-l-slate-300"
                  )}
                >
                  <td className="px-3 py-1.5 text-center text-muted-foreground font-mono text-[10px]">
                    {idx + 1}
                  </td>

                  {/* Unternehmen */}
                  <td className="p-1 excel-cell">
                    <input
                      type="text"
                      value={row.companyName}
                      placeholder="Firma Name..."
                      onChange={(e) => handleCellChange(row.id, "companyName", e.target.value)}
                      className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
                    />
                  </td>

                  {/* Position */}
                  <td className="p-1 excel-cell">
                    <input
                      type="text"
                      value={row.position}
                      placeholder="Frontend Entwickler..."
                      onChange={(e) => handleCellChange(row.id, "position", e.target.value)}
                      className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
                    />
                  </td>

                  {/* Datum */}
                  {visibleCols.date && (
                    <td className="p-1 excel-cell">
                      <input
                        type="date"
                        value={row.applicationDate}
                        onChange={(e) => handleCellChange(row.id, "applicationDate", e.target.value)}
                        className="w-full rounded px-1.5 py-1 bg-transparent text-xs text-foreground focus:outline-none focus:bg-surface"
                      />
                    </td>
                  )}

                  {/* Portal */}
                  {visibleCols.portal && (
                    <td className="p-1 excel-cell">
                      <select
                        value={row.portal}
                        onChange={(e) => handleCellChange(row.id, "portal", e.target.value)}
                        className="w-full rounded px-1.5 py-1 bg-transparent text-xs text-foreground focus:outline-none focus:bg-surface"
                      >
                        <option value="">(Kein Portal)</option>
                        {JOB_PORTALS.map((p) => (
                          <option key={p.value} value={p.label}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}

                  {/* Status */}
                  {visibleCols.status && (
                    <td className="p-1 excel-cell">
                      <select
                        value={row.status}
                        onChange={(e) => handleCellChange(row.id, "status", e.target.value)}
                        className={cn(
                          "w-full rounded px-2 py-1 text-xs font-bold focus:outline-none focus:bg-surface border border-current/20",
                          row.status === "SENT" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                          row.status === "INTERVIEW" && "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                          row.status === "OFFER" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                          row.status === "REJECTED" && "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                          row.status === "WITHDRAWN" && "bg-gray-500/15 text-gray-700 dark:text-gray-300",
                          row.status === "DRAFT" && "bg-slate-500/15 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s.value} value={s.value} className="bg-surface text-foreground font-normal">
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}

                  {/* Ansprechpartner */}
                  {visibleCols.contact && (
                    <td className="p-1 excel-cell">
                      <input
                        type="text"
                        value={row.contactName}
                        placeholder="z. B. Fr. Müller"
                        onChange={(e) => handleCellChange(row.id, "contactName", e.target.value)}
                        className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
                      />
                    </td>
                  )}

                  {/* Kontakt E-Mail / Tel */}
                  {visibleCols.email && (
                    <td className="p-1 excel-cell">
                      <input
                        type="text"
                        value={row.contactEmail || row.contactPhone}
                        placeholder="kontakt@firma.de"
                        onChange={(e) => handleCellChange(row.id, "contactEmail", e.target.value)}
                        className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
                      />
                    </td>
                  )}

                  {/* Wiedervorlage / Datum */}
                  {visibleCols.followUp && (
                    <td className="p-1 excel-cell">
                      <input
                        type="date"
                        value={row.nextStepDate}
                        onChange={(e) => handleCellChange(row.id, "nextStepDate", e.target.value)}
                        className="w-full rounded px-1.5 py-1 bg-transparent text-xs text-foreground focus:outline-none focus:bg-surface"
                      />
                    </td>
                  )}

                  {/* Notizen */}
                  {visibleCols.notes && (
                    <td className="p-1 excel-cell">
                      <input
                        type="text"
                        value={row.notes}
                        placeholder="Notizen zur Bewerbung …"
                        onChange={(e) => handleCellChange(row.id, "notes", e.target.value)}
                        className="w-full rounded px-2 py-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-surface"
                      />
                    </td>
                  )}

                  {/* Aktionen */}
                  {visibleCols.actions && (
                    <td className="p-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!row.id.startsWith("temp-") && (
                          <Link href={`/applications/${row.id}`} title="Zur Detailansicht">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRow(row)}
                          className="h-6 w-6 text-danger hover:bg-danger-soft"
                          title="Zeile entfernen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasMoreRows && (
        <div className="flex justify-center">
          <Button size="sm" variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="card-hover-effect">
            {loadingMore ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            {loadingMore ? "Lade …" : `Weitere ${Math.min(EXCEL_PAGE_SIZE, total - persistedRowCount)} laden`}
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
