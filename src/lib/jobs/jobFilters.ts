// -----------------------------------------------------------------------------
// Client-seitige Filter-/Sortierlogik der Jobliste (src/app/jobs/page.tsx).
// Ausgelagert, damit sie ohne React testbar ist.
// -----------------------------------------------------------------------------
import type { JobPostingWithCompany } from "@/types";

export type JobSortOption = "SCORE_DESC" | "DATE_DESC" | "COMPANY_ASC";
export type JobViewMode = "ACTIVE" | "DISMISSED";

export type JobFilters = {
  search: string;
  portal: string; // "ALL" oder Portal-Wert
  match: string; // "ALL" | "TOP" (>= 75) | "GOOD" (>= 50)
  remote: string; // "ALL" | "REMOTE" | "ONSITE"
  sortBy: JobSortOption;
};

export const DEFAULT_JOB_FILTERS: JobFilters = {
  search: "",
  portal: "ALL",
  match: "ALL",
  remote: "ALL",
  sortBy: "SCORE_DESC",
};

export const TOP_MATCH_SCORE = 75;
export const GOOD_MATCH_SCORE = 50;

/** Ob ein Filter aktiv ist (die Sortierung zählt bewusst nicht dazu). */
export function hasActiveJobFilters(filters: JobFilters): boolean {
  return (
    filters.portal !== "ALL" ||
    filters.match !== "ALL" ||
    filters.remote !== "ALL" ||
    filters.search.trim() !== ""
  );
}

export type JobFilterContext = {
  viewMode: JobViewMode;
  /** Mindest-Match-Score aus den Einstellungen (0 = deaktiviert). */
  minMatchScore: number;
  /** Ob der Mindest-Match-Score aktuell angewendet werden soll. */
  respectThreshold: boolean;
};

/** Anzahl Angebote unterhalb des Mindest-Match-Scores (0, wenn keiner gesetzt ist). */
export function countBelowThreshold(jobs: JobPostingWithCompany[] | undefined, minMatchScore: number): number {
  if (!jobs || minMatchScore <= 0) return 0;
  return jobs.filter((j) => (j.matchScore ?? 0) < minMatchScore).length;
}

/** Wendet Filter an und sortiert; verändert die Eingabeliste nicht. */
export function filterAndSortJobs(
  jobs: JobPostingWithCompany[] | undefined,
  filters: JobFilters,
  context: JobFilterContext,
): JobPostingWithCompany[] {
  if (!jobs) return [];
  let list = [...jobs];

  // Mindest-Match-Score aus den Einstellungen (nur in der Ansicht "Aktive
  // Angebote" relevant — ausgeblendete Angebote sollen weiterhin vollständig
  // einsehbar sein, unabhängig vom Score).
  if (context.respectThreshold && context.viewMode === "ACTIVE" && context.minMatchScore > 0) {
    list = list.filter((j) => (j.matchScore ?? 0) >= context.minMatchScore);
  }

  if (filters.portal !== "ALL") {
    list = list.filter((j) => j.portalSource === filters.portal);
  }

  if (filters.match === "TOP") {
    list = list.filter((j) => (j.matchScore ?? 0) >= TOP_MATCH_SCORE);
  } else if (filters.match === "GOOD") {
    list = list.filter((j) => (j.matchScore ?? 0) >= GOOD_MATCH_SCORE);
  }

  if (filters.remote === "REMOTE") {
    list = list.filter((j) => j.remote);
  } else if (filters.remote === "ONSITE") {
    list = list.filter((j) => !j.remote);
  }

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        (j.company?.name && j.company.name.toLowerCase().includes(q)) ||
        (j.techStack && j.techStack.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q)) ||
        j.description.toLowerCase().includes(q),
    );
  }

  list.sort((a, b) => {
    switch (filters.sortBy) {
      case "SCORE_DESC":
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      case "DATE_DESC":
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      case "COMPANY_ASC":
        return (a.company?.name || "").localeCompare(b.company?.name || "");
      default:
        return 0;
    }
  });

  return list;
}
