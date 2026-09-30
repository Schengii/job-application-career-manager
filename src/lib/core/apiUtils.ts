// -----------------------------------------------------------------------------
// Kleine Hilfsfunktionen für konsistente API-Route-Handler
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Wandelt bekannte Fehlertypen (Zod-Validierung, Prisma "not found") in eine einheitliche JSON-Response um. */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: error.flatten() },
      { status: 400 },
    );
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: string }).code;

    if (code === "P2025") {
      return NextResponse.json({ error: "Datensatz wurde nicht gefunden" }, { status: 404 });
    }

    // P2003 (Prisma) / 23503 (PostgreSQL native): Fremdschlüsselverletzung
    if (code === "P2003" || code === "23503") {
      return NextResponse.json(
        { error: "Ungültige Referenz: Ein verknüpfter Datensatz (z. B. Unternehmen oder Stellenangebot) existiert nicht." },
        { status: 400 },
      );
    }

    // P2002 (Prisma) / 23505 (PostgreSQL native): Unique-Constraint-Verletzung
    if (code === "P2002" || code === "23505") {
      return NextResponse.json(
        { error: "Ein Datensatz mit diesem eindeutigen Wert existiert bereits." },
        { status: 409 },
      );
    }
  }

  console.error(error);
  const message = error instanceof Error ? error.message : "Unbekannter Serverfehler";
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Konvertiert leere Strings / undefined zu null bzw. wandelt ISO-Strings in Date-Objekte um (für Prisma DateTime-Felder). */
export function toDateOrNull(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return new Date(value);
}

// -----------------------------------------------------------------------------
// Pagination — opt-in über `?page=`/`?pageSize=`
// -----------------------------------------------------------------------------
// Die Listen-Endpunkte (/api/applications, /api/companies, /api/jobs) geben
// standardmäßig weiterhin ein einfaches Array zurück, damit die zahlreichen
// bestehenden Frontend-Konsumenten (Dashboard, Kanban, Excel-Grid, Command
// Palette, Notification-Bell, ...) unverändert funktionieren. Erst wenn ein
// Client explizit `page` oder `pageSize` mitschickt, wechselt die Route auf
// eine paginierte Antwort im Format `PaginatedResult<T>`. Das hält die
// Datenmenge pro Request beherrschbar, sobald die Anzahl an Bewerbungen/
// Unternehmen/Jobs deutlich wächst, ohne einen Breaking Change zu erzwingen.
// -----------------------------------------------------------------------------
export type PaginationParams = { page: number; pageSize: number; skip: number; take: number };

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

/** Liest `page`/`pageSize` aus den Query-Parametern; `null`, wenn keines von beiden gesetzt ist (= "kein Pagination-Modus"). */
export function parsePagination(searchParams: URLSearchParams): PaginationParams | null {
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  if (pageParam === null && pageSizeParam === null) return null;

  const page = Math.max(1, Math.trunc(Number(pageParam)) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(Number(pageSizeParam)) || DEFAULT_PAGE_SIZE));

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function toPaginatedResult<T>(data: T[], total: number, pagination: PaginationParams): PaginatedResult<T> {
  return {
    data,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}
