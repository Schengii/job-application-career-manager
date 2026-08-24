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

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  ) {
    return NextResponse.json({ error: "Datensatz wurde nicht gefunden" }, { status: 404 });
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
