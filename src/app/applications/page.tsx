"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import {
  Plus,
  Table2,
  LayoutGrid,
  FileSpreadsheet,
  Download,
  Upload,
  ArrowUpRight,
  Mail,
  Search,
  SlidersHorizontal,
  X,
  Video,
  FileText,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import type { ApplicationListItem } from "@/types";
import type { PaginatedResult } from "@/lib/apiUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { formatDate, cn } from "@/lib/utils";
import { APPLICATION_STATUSES, JOB_PORTALS } from "@/lib/constants";
import { ApplicationFormDialog, quickUpdateStatus } from "@/components/applications/application-form-dialog";
import { KanbanBoard } from "@/components/applications/kanban-board";
import { useToast } from "@/components/ui/toast";
import { applicationsToCsv, downloadCsv } from "@/lib/csv";
import { EmailResponseModal } from "@/components/applications/email-response-modal";
import { ExcelGridTable } from "@/components/excel/excel-grid-table";
import { ExcelImportModal } from "@/components/excel/excel-import-modal";
import { BatchActionBar } from "@/components/applications/batch-action-bar";
import { SavedFiltersBar } from "@/components/applications/saved-filters-bar";
import { EigenbemuehungenModal } from "@/components/applications/eigenbemuehungen-modal";
import type { SavedFilterValues } from "@/lib/savedFilters";
import { parseTags, getTagStyle } from "@/lib/tags";

const TABLE_PAGE_SIZE = 25;
// Verzögerung, bevor eine geänderte Volltextsuche einen neuen (paginierten)
// Server-Request auslöst — verhindert einen Request pro Tastenanschlag.
const SEARCH_DEBOUNCE_MS = 300;

type ViewMode = "table" | "kanban" | "excel";
type SortOption = "DATE_DESC" | "DATE_ASC" | "COMPANY_ASC" | "STATUS";

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [portalFilter, setPortalFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFollowUps, setOnlyFollowUps] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("DATE_DESC");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [eigenbemuehungenOpen, setEigenbemuehungenOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("table");

  // Server-seitige Pagination NUR für die Tabellenansicht (siehe
  // src/lib/applicationQuery.ts) — Kanban bleibt bewusst bei der vollen,
  // ungepaginierten Liste (`applications` oben), damit die Spalten weiterhin
  // alle Bewerbungen zeigen, unabhängig von einer Seite.
  const [tablePageNum, setTablePageNum] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Bei jeder Filteränderung zurück auf Seite 1 (sonst könnte man auf einer
  // Seite landen, die es für den neuen Filter gar nicht mehr gibt). Bewusst
  // NICHT als useEffect (das würde einen zusätzlichen Render-Durchlauf nach
  // dem Commit erzwingen), sondern als "State während des Renderns anpassen"
  // — das von React empfohlene Muster, wenn sich abgeleiteter State direkt
  // aus einer Prop-/State-Änderung ergibt (siehe react-hooks/set-state-in-effect).
  const filterSignature = `${statusFilter}|${portalFilter}|${tagFilter}|${debouncedSearch}|${onlyFollowUps}|${sortBy}`;
  const [prevFilterSignature, setPrevFilterSignature] = useState(filterSignature);
  if (filterSignature !== prevFilterSignature) {
    setPrevFilterSignature(filterSignature);
    setTablePageNum(1);
  }

  const tableQueryKey = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(tablePageNum));
    params.set("pageSize", String(TABLE_PAGE_SIZE));
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (portalFilter !== "ALL") params.set("portal", portalFilter);
    if (tagFilter !== "ALL") params.set("tag", tagFilter);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (onlyFollowUps) params.set("onlyFollowUps", "true");
    params.set("sortBy", sortBy);
    return `/api/applications?${params.toString()}`;
  }, [tablePageNum, statusFilter, portalFilter, tagFilter, debouncedSearch, onlyFollowUps, sortBy]);

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

  // Aggregiere alle eindeutigen Tags
  const availableTags = useMemo(() => {
    if (!applications) return [];
    const tagSet = new Set<string>();
    for (const app of applications) {
      for (const t of parseTags(app.tags)) {
        tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort();
  }, [applications]);

  const filtered = useMemo(() => {
    if (!applications) return [];
    let list = [...applications];

    // Status Filter
    if (statusFilter !== "ALL") {
      list = list.filter((a) => a.status === statusFilter);
    }

    // Portal Filter
    if (portalFilter !== "ALL") {
      list = list.filter((a) => (a.source || a.jobPosting?.portalSource) === portalFilter);
    }

    // Tag Filter
    if (tagFilter !== "ALL") {
      list = list.filter((a) => parseTags(a.tags).includes(tagFilter));
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.company.name.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q) ||
          (a.tags && a.tags.toLowerCase().includes(q)) ||
          (a.notes && a.notes.toLowerCase().includes(q)) ||
          (a.nextStep && a.nextStep.toLowerCase().includes(q))
      );
    }

    // Follow-up Filter
    if (onlyFollowUps) {
      list = list.filter((a) => a.nextStep || a.nextStepDate);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "DATE_DESC") {
        const da = a.applicationDate ? new Date(a.applicationDate).getTime() : 0;
        const db = b.applicationDate ? new Date(b.applicationDate).getTime() : 0;
        return db - da;
      }
      if (sortBy === "DATE_ASC") {
        const da = a.applicationDate ? new Date(a.applicationDate).getTime() : 0;
        const db = b.applicationDate ? new Date(b.applicationDate).getTime() : 0;
        return da - db;
      }
      if (sortBy === "COMPANY_ASC") {
        return a.company.name.localeCompare(b.company.name);
      }
      if (sortBy === "STATUS") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    return list;
  }, [applications, statusFilter, portalFilter, tagFilter, searchQuery, onlyFollowUps, sortBy]);

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    portalFilter !== "ALL" ||
    tagFilter !== "ALL" ||
    searchQuery.trim() !== "" ||
    onlyFollowUps;

  function resetFilters() {
    setStatusFilter("ALL");
    setPortalFilter("ALL");
    setTagFilter("ALL");
    setSearchQuery("");
    setOnlyFollowUps(false);
  }

  function handleApplyFilterPreset(preset: SavedFilterValues) {
    setStatusFilter(preset.status);
    setPortalFilter(preset.portal);
    setTagFilter(preset.tag ?? "ALL");
    setSearchQuery(preset.search);
    setOnlyFollowUps(preset.onlyFollowUps);
    setSortBy(preset.sortBy as SortOption);
  }

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
        // SWR-Key (s. tableQueryKey oben) — der muss nach einem Statuswechsel
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

      {/* Filter- & Such-Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs glass-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
            {/* Freitext-Suche */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Firma, Position, Tag, Notiz suchen …"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Portal-Filter */}
            <Select
              value={portalFilter}
              onChange={(e) => setPortalFilter(e.target.value)}
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
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
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
              onClick={() => setOnlyFollowUps(!onlyFollowUps)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
                onlyFollowUps
                  ? "border-primary bg-primary-soft text-primary font-semibold"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Nur Wiedervorlage</span>
            </button>

            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={resetFilters} className="h-9 text-xs text-muted-foreground hover:text-danger">
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
              onClick={() => setView("table")}
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
              onClick={() => setView("kanban")}
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
              onClick={() => setView("excel")}
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
          <FilterChip active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
            Alle ({applications?.length ?? 0})
          </FilterChip>
          {APPLICATION_STATUSES.map((s) => (
            <FilterChip key={s.value} active={statusFilter === s.value} onClick={() => setStatusFilter(s.value)}>
              {s.label} ({applications?.filter((a) => a.status === s.value).length ?? 0})
            </FilterChip>
          ))}
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
              tag: tagFilter,
              search: searchQuery,
              onlyFollowUps,
              sortBy,
            }}
            onApply={handleApplyFilterPreset}
          />
        </div>
      </div>

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
        <Card className="overflow-hidden">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-surface-hover/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={tableRows.length > 0 && selectedIds.length === tableRows.length}
                      onChange={handleSelectAll}
                      className="rounded border-border cursor-pointer"
                      title="Alle auswählen"
                    />
                  </th>
                  <th className="px-5 py-3 font-medium">Firma</th>
                  <th className="px-5 py-3 font-medium">Position & Tags</th>
                  <th className="px-5 py-3 font-medium">Datum</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Nächster Schritt</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isTableLoading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                      Lade Bewerbungen …
                    </td>
                  </tr>
                )}
                {!isTableLoading && tableRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                      Keine Bewerbungen für diesen Filter gefunden.
                    </td>
                  </tr>
                )}
                {tableRows.map((app) => {
                  const tags = parseTags(app.tags);
                  const isSelected = selectedIds.includes(app.id);

                  return (
                    <tr
                      key={app.id}
                      className={cn(
                        "hover:bg-surface-hover/60 transition-colors",
                        isSelected && "bg-primary/5",
                        app.status === "SENT" && "border-l-4 border-l-amber-500",
                        app.status === "INTERVIEW" && "border-l-4 border-l-sky-500",
                        app.status === "OFFER" && "border-l-4 border-l-emerald-500",
                        app.status === "REJECTED" && "border-l-4 border-l-rose-500",
                        app.status === "WITHDRAWN" && "border-l-4 border-l-slate-400",
                        app.status === "DRAFT" && "border-l-4 border-l-slate-300"
                      )}
                    >
                      <td className="w-10 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(app.id)}
                          className="rounded border-border cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/applications/${app.id}`} className="font-semibold text-foreground hover:underline">
                          {app.company.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">{app.position}</span>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tags.map((t) => (
                                <span
                                  key={t}
                                  className={cn("rounded px-1.5 py-0.2 text-[10px] font-semibold", getTagStyle(t))}
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(app.applicationDate)}</td>
                      <td className="px-5 py-3">
                        <label className="sr-only" htmlFor={`status-${app.id}`}>
                          Status für {app.position}
                        </label>
                        <Select
                          id={`status-${app.id}`}
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="h-8 w-auto py-1 text-xs font-semibold"
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="max-w-[220px] px-5 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{app.nextStep ?? "—"}</span>
                          {app.meetingUrl && (
                            <a
                              href={app.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded bg-primary-soft p-1 text-primary hover:bg-primary hover:text-white transition-colors shrink-0"
                              title="Online-Meeting beitreten"
                            >
                              <Video className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/applications/${app.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          Details <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
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
