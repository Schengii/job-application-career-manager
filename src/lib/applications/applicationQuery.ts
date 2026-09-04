// -----------------------------------------------------------------------------
// Baut Prisma `where`/`orderBy` für GET /api/applications im paginierten Modus
// (?page=/?pageSize=). Bildet exakt die client-seitige Filterlogik nach, die
// bisher in src/app/applications/page.tsx (Tabellen-Ansicht) lief, jetzt aber
// serverseitig laufen muss, damit Filter und Pagination sich nicht
// widersprechen (ein Client-Filter auf nur einer geladenen Seite würde sonst
// scheinbar "fehlende" Treffer auf anderen Seiten verstecken).
//
// Der unpaginierte Modus (ohne ?page=/?pageSize=, z.B. Kanban-Board,
// Dashboard-Metriken) bleibt davon unberührt — dort wird weiterhin der
// komplette Datensatz geladen und ausschließlich client-seitig gefiltert.
// -----------------------------------------------------------------------------
import type { Prisma } from "@/generated/prisma/client";

export type ApplicationSortOption = "DATE_DESC" | "DATE_ASC" | "COMPANY_ASC" | "STATUS";

// Antwortform von GET /api/applications/status-counts — Facet-Counts pro
// Status unter den übrigen aktiven Filtern, genutzt von der Excel-
// Tabellenansicht (src/components/excel/excel-grid-table.tsx) für die
// Zähler in den Status-Dropdown-Optionen (die sonst nur die aktuell
// geladene Seite zählen würden statt aller Bewerbungen).
export type ApplicationStatusCounts = { total: number; byStatus: Record<string, number> };

export type ApplicationQueryParams = {
  status?: string | null;
  portal?: string | null;
  tag?: string | null;
  search?: string | null;
  onlyFollowUps?: boolean;
  sortBy?: ApplicationSortOption | null;
};

/** Liest die Filter-Query-Parameter aus einer URLSearchParams-Instanz (nur im paginierten Modus relevant). */
export function parseApplicationQueryParams(searchParams: URLSearchParams): ApplicationQueryParams {
  return {
    status: searchParams.get("status"),
    portal: searchParams.get("portal"),
    tag: searchParams.get("tag"),
    search: searchParams.get("search"),
    onlyFollowUps: searchParams.get("onlyFollowUps") === "true",
    sortBy: searchParams.get("sortBy") as ApplicationSortOption | null,
  };
}

export function buildApplicationWhere(params: ApplicationQueryParams): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {};
  const and: Prisma.ApplicationWhereInput[] = [];

  if (params.status) {
    where.status = params.status;
  }

  if (params.portal) {
    // Quelle steht entweder direkt auf der Bewerbung (`source`, z.B. bei
    // manueller Erfassung) oder kommt vom verknüpften JobPosting — dieselbe
    // Fallback-Logik wie bisher client-seitig (`a.source || a.jobPosting?.portalSource`).
    and.push({
      OR: [{ source: params.portal }, { jobPosting: { portalSource: params.portal } }],
    });
  }

  if (params.tag) {
    // Tags sind ein kommaseparierter String OHNE Leerzeichen um die Kommas
    // (siehe stringifyTags() in src/lib/tags.ts — jeder Schreibpfad geht
    // darüber). Ein einfacher `contains`-Filter wäre nur eine Näherung und
    // liefert falsch-positive Treffer bei Tags, die Teilstring eines anderen
    // sind (z.B. "react" träfe fälschlich auch "react19" — beides reale,
    // vordefinierte Tags dieses Projekts, s. TAG_COLOR_PRESETS in tags.ts).
    // Die 4 Varianten unten bilden exakt jede mögliche Position eines Tags
    // in der kommaseparierten Liste ab (einziger Tag / erster / letzter /
    // mittendrin) und entsprechen damit exakt dem client-seitigen
    // `parseTags(a.tags).includes(tag)` aus dem Kanban-Board.
    and.push({
      OR: [
        { tags: { equals: params.tag } },
        { tags: { startsWith: `${params.tag},` } },
        { tags: { endsWith: `,${params.tag}` } },
        { tags: { contains: `,${params.tag},` } },
      ],
    });
  }

  if (params.search?.trim()) {
    const q = params.search.trim();
    and.push({
      OR: [
        { position: { contains: q } },
        { company: { name: { contains: q } } },
        { tags: { contains: q } },
        { notes: { contains: q } },
        { nextStep: { contains: q } },
      ],
    });
  }

  if (params.onlyFollowUps) {
    and.push({ OR: [{ nextStep: { not: null } }, { nextStepDate: { not: null } }] });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

export function buildApplicationOrderBy(
  sortBy?: ApplicationSortOption | null
): Prisma.ApplicationOrderByWithRelationInput[] {
  switch (sortBy) {
    case "DATE_ASC":
      return [{ applicationDate: "asc" }];
    case "COMPANY_ASC":
      return [{ company: { name: "asc" } }];
    case "STATUS":
      return [{ status: "asc" }];
    case "DATE_DESC":
    default:
      return [{ applicationDate: "desc" }];
  }
}
