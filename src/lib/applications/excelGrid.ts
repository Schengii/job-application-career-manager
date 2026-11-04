// -----------------------------------------------------------------------------
// Reine Logik der Excel-Tabellenansicht (src/components/excel/): Zeilen-/
// Filtertypen, URL-Builder für die serverseitig gefilterte Pagination,
// Konvertierung API -> Grid-Zeile, client-seitige Sortierung und
// Spalten-Presets. Ausgelagert aus excel-grid-table.tsx, damit sie ohne React
// testbar ist.
// -----------------------------------------------------------------------------
import type { ApplicationListItem } from "@/types";
import type { ApplicationSortOption } from "@/lib/applications/applicationQuery";

// Seitengröße für den initialen Ladevorgang & jedes weitere "Weitere laden".
// Begrenzt die anfänglich geladene (und ins DOM gerenderte) Zeilenmenge, statt
// bei jedem Öffnen der Ansicht sofort ALLE Bewerbungen zu laden — nutzt
// dieselbe Pagination-Infrastruktur wie die Tabellenansicht
// (src/lib/core/apiUtils.ts).
export const EXCEL_PAGE_SIZE = 50;

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

export const DEFAULT_COLUMNS: VisibleColumns = {
  date: true,
  portal: true,
  status: true,
  contact: true,
  email: true,
  followUp: true,
  notes: true,
  actions: true,
};

export type ColumnPreset = "ALL" | "COMPACT" | "CONTACTS";

export const COLUMN_PRESETS: Record<ColumnPreset, VisibleColumns> = {
  ALL: DEFAULT_COLUMNS,
  COMPACT: {
    date: true,
    portal: false,
    status: true,
    contact: false,
    email: false,
    followUp: false,
    notes: false,
    actions: true,
  },
  CONTACTS: {
    date: false,
    portal: false,
    status: true,
    contact: true,
    email: true,
    followUp: false,
    notes: true,
    actions: true,
  },
};

/** Beschriftung der schaltbaren Spalten (Reihenfolge = Reihenfolge im Spalten-Popover). */
export const COLUMN_OPTIONS: { key: keyof VisibleColumns; label: string }[] = [
  { key: "date", label: "Datum" },
  { key: "portal", label: "Portal / Quelle" },
  { key: "status", label: "Status" },
  { key: "contact", label: "Ansprechpartner" },
  { key: "email", label: "E-Mail / Tel" },
  { key: "followUp", label: "Wiedervorlage" },
  { key: "notes", label: "Notizen / Anmerkungen" },
  { key: "actions", label: "Aktionen" },
];

export const COLS_STORAGE_KEY = "career_manager_excel_cols";

export type CommittedFilters = {
  status: string;
  portal: string;
  search: string;
  onlyFollowUps: boolean;
  sortBy: ApplicationSortOption;
};

export const DEFAULT_FILTERS: CommittedFilters = {
  status: "ALL",
  portal: "ALL",
  search: "",
  onlyFollowUps: false,
  sortBy: "DATE_DESC",
};

export function areFiltersEqual(a: CommittedFilters, b: CommittedFilters): boolean {
  return (
    a.status === b.status &&
    a.portal === b.portal &&
    a.search === b.search &&
    a.onlyFollowUps === b.onlyFollowUps &&
    a.sortBy === b.sortBy
  );
}

/** Baut die paginierte, serverseitig gefilterte Applications-URL (siehe src/lib/applications/applicationQuery.ts). */
export function buildFilteredQueryUrl(page: number, filters: CommittedFilters): string {
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
export function buildStatusCountsQueryUrl(filters: CommittedFilters): string {
  const params = new URLSearchParams();
  if (filters.portal !== "ALL") params.set("portal", filters.portal);
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.onlyFollowUps) params.set("onlyFollowUps", "true");
  return `/api/applications/status-counts?${params.toString()}`;
}

/** Wandelt ein ApplicationListItem aus der API in eine editierbare Grid-Zeile um. */
export function toExcelRow(app: ApplicationListItem): ExcelRow {
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

/** Ungespeicherte neue Zeilen haben eine temporäre ID und existieren serverseitig noch nicht. */
export function isTempRow(row: Pick<ExcelRow, "id">): boolean {
  return row.id.startsWith("temp-");
}

/**
 * Client-seitige Sortierung (Status/Portal/Suche/Wiedervorlage laufen
 * serverseitig): sorgt dafür, dass neu hinzugefügte Zeilen sinnvoll
 * einsortiert erscheinen, ohne einen Server-Roundtrip. Verändert die
 * Eingabeliste nicht.
 */
export function sortExcelRows(rows: ExcelRow[], sortBy: ApplicationSortOption): ExcelRow[] {
  const list = [...rows];
  list.sort((a, b) => {
    switch (sortBy) {
      case "DATE_DESC":
        return b.applicationDate.localeCompare(a.applicationDate);
      case "DATE_ASC":
        return a.applicationDate.localeCompare(b.applicationDate);
      case "COMPANY_ASC":
        return a.companyName.localeCompare(b.companyName);
      case "STATUS":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });
  return list;
}
