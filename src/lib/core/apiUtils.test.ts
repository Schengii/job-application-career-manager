// -----------------------------------------------------------------------------
// Unit-Test: handleApiError() — zentrale Fehler-Übersetzung für alle API-Routen
// -----------------------------------------------------------------------------
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { handleApiError, toDateOrNull } from "@/lib/core/apiUtils";

describe("handleApiError", () => {
  it("übersetzt einen ZodError in 400 + Validierungsdetails", async () => {
    let zodError: unknown;
    try {
      z.object({ name: z.string().min(1) }).parse({});
    } catch (err) {
      zodError = err;
    }

    const response = handleApiError(zodError);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validierungsfehler");
    expect(body.details).toBeDefined();
  });

  it("übersetzt Prisma P2025 (Not Found) in 404", async () => {
    const response = handleApiError({ code: "P2025" });
    expect(response.status).toBe(404);
  });

  it("übersetzt Prisma P2003 (Fremdschlüsselverletzung) in 400 statt 500", async () => {
    const response = handleApiError({ code: "P2003" });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/Referenz/);
  });

  it("übersetzt Prisma P2002 (Unique-Constraint) in 409", async () => {
    const response = handleApiError({ code: "P2002" });
    expect(response.status).toBe(409);
  });

  it("fällt für unbekannte Fehler auf 500 mit Fehlermeldung zurück", async () => {
    const response = handleApiError(new Error("Etwas ist kaputt"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Etwas ist kaputt");
  });

  it("fällt für nicht-Error-Werte auf eine generische 500-Nachricht zurück", async () => {
    const response = handleApiError("ein String, kein Error-Objekt");
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Unbekannter Serverfehler");
  });
});

describe("toDateOrNull", () => {
  it("gibt undefined für undefined zurück (Feld nicht angetastet)", () => {
    expect(toDateOrNull(undefined)).toBeUndefined();
  });

  it("gibt null für null und für einen leeren String zurück", () => {
    expect(toDateOrNull(null)).toBeNull();
    expect(toDateOrNull("")).toBeNull();
  });

  it("parst einen ISO-String zu einem Date-Objekt", () => {
    const result = toDateOrNull("2026-01-15T10:00:00.000Z");
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe("2026-01-15T10:00:00.000Z");
  });
});
