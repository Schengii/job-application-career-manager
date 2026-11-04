// -----------------------------------------------------------------------------
// Client-seitige Filter-/Sortierlogik der Bewerbungsliste (Kanban-Ansicht und
// CSV-Export in src/app/applications/page.tsx). Die Tabellenansicht filtert
// dagegen serverseitig (src/lib/applications/applicationQuery.ts) — beide
// Implementierungen müssen semantisch übereinstimmen.
// -----------------------------------------------------------------------------
import type { ApplicationListItem } from "@/types";
import type { ApplicationSortOption } from "@/lib/applications/applicationQuery";
import { parseTags } from "@/lib/core/tags";

export type ApplicationFilters = {
  status: string; // "ALL" oder ein Status-Wert
  portal: string; // "ALL" oder Portal-Label
  tag: string; // "ALL" oder ein Tag
  search: string;
  onlyFollowUps: boolean;
  sortBy: ApplicationSortOption;
};

export const DEFAULT_APPLICATION_FILTERS: ApplicationFilters = {
  status: "ALL",
  portal: "ALL",
  tag: "ALL",
  search: "",
  onlyFollowUps: false,
  sortBy: "DATE_DESC",
};

/** Sortierte, eindeutige Liste aller Tags über alle Bewerbungen. */
export function collectTags(applications: Pick<ApplicationListItem, "tags">[] | undefined): string[] {
  if (!applications) return [];
  const tagSet = new Set<string>();
  for (const app of applications) {
    for (const t of parseTags(app.tags)) tagSet.add(t);
  }
  return Array.from(tagSet).sort();
}

/** Ob ein Filter aktiv ist (die Sortierung zählt bewusst nicht dazu). */
export function hasActiveFilters(filters: ApplicationFilters): boolean {
  return (
    filters.status !== "ALL" ||
    filters.portal !== "ALL" ||
    filters.tag !== "ALL" ||
    filters.search.trim() !== "" ||
    filters.onlyFollowUps
  );
}

function dateValue(value: ApplicationListItem["applicationDate"]): number {
  return value ? new Date(value).getTime() : 0;
}

/** Wendet Filter an und sortiert; verändert die Eingabeliste nicht. */
export function filterAndSortApplications(
  applications: ApplicationListItem[] | undefined,
  filters: ApplicationFilters,
): ApplicationListItem[] {
  if (!applications) return [];
  let list = [...applications];

  if (filters.status !== "ALL") {
    list = list.filter((a) => a.status === filters.status);
  }

  if (filters.portal !== "ALL") {
    list = list.filter((a) => (a.source || a.jobPosting?.portalSource) === filters.portal);
  }

  if (filters.tag !== "ALL") {
    list = list.filter((a) => parseTags(a.tags).includes(filters.tag));
  }

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (a) =>
        a.company.name.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q) ||
        (a.tags && a.tags.toLowerCase().includes(q)) ||
        (a.notes && a.notes.toLowerCase().includes(q)) ||
        (a.nextStep && a.nextStep.toLowerCase().includes(q)),
    );
  }

  if (filters.onlyFollowUps) {
    list = list.filter((a) => a.nextStep || a.nextStepDate);
  }

  list.sort((a, b) => {
    switch (filters.sortBy) {
      case "DATE_DESC":
        return dateValue(b.applicationDate) - dateValue(a.applicationDate);
      case "DATE_ASC":
        return dateValue(a.applicationDate) - dateValue(b.applicationDate);
      case "COMPANY_ASC":
        return a.company.name.localeCompare(b.company.name);
      case "STATUS":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  return list;
}
