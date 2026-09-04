// -----------------------------------------------------------------------------
// Optionales monatliches KI-Kostenlimit (Warnschwelle, keine harte Sperre)
// -----------------------------------------------------------------------------
// Ergänzt src/lib/aiUsageTracker.ts um einen vom Nutzer frei wählbaren
// USD-Schwellenwert, ab dem die AiUsageCard eine Warnung anzeigt, falls die
// geschätzten Kosten des laufenden Kalendermonats den Wert erreichen/
// überschreiten. Bewusst KEINE Sperre der KI-Funktionen selbst — nur ein
// Hinweis, damit ein versehentlich teures Modell nicht unbemerkt Kosten
// verursacht.
//
// Persistenz bewusst client-seitig via localStorage (analog zu
// src/lib/savedFilters.ts) statt als neues Preferences-Feld: reines UI-
// Komfort-Feature ohne Bezug zu Domänendaten, ein neues Prisma-Feld +
// Migration wäre für einen einzelnen optionalen Schwellenwert
// unverhältnismäßiger Mehraufwand.
// -----------------------------------------------------------------------------

const STORAGE_KEY = "career_manager_ai_monthly_budget_usd";

/** Liest das gespeicherte Kostenlimit in USD, oder `null` wenn keins gesetzt/gültig ist. */
export function getAiMonthlyBudgetUsd(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null; // z.B. privater Browser-Modus ohne localStorage-Zugriff
  }
}

/** Setzt (oder löscht mit `null`) das monatliche Kostenlimit in USD. */
export function setAiMonthlyBudgetUsd(value: number | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null || !Number.isFinite(value) || value <= 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  } catch {
    // z.B. privater Modus / Speicher voll — Limit bleibt dann nur für die
    // aktuelle Sitzung im React-State gesetzt, kein funktionaler Fehler.
  }
}
