// -----------------------------------------------------------------------------
// KI-Kosten-/Token-Tracking (Einstellungen -> Profil & Präferenzen)
// -----------------------------------------------------------------------------
// Protokolliert nach jedem tatsächlich ausgeführten (nicht auf die
// Offline-Heuristik zurückgefallenen) KI-Request in src/lib/aiService.ts
// Provider, Modell, verbrauchte Tokens und eine GESCHÄTZTE Kostenangabe in
// USD. Ohne dieses Tracking blieb für den Nutzer unsichtbar, wie viel ein
// hinterlegter API-Key (Einstellungen -> Profil & Präferenzen) tatsächlich
// verbraucht — gerade bei zahlungspflichtigen Cloud-Providern (OpenAI,
// Anthropic) relevant.
//
// Bewusst dieselbe Zero-Config-Persistenz wie src/lib/secretCrypto.ts /
// src/lib/vapidKeys.ts (lokale JSON-Datei statt Prisma-Modell): Ein neues
// Datenbank-Feld hätte eine Schema-Migration verlangt, dieses rein lokale
// Nutzungsprotokoll ist dafür nicht kritisch genug (bei Verlust der Datei
// geht nur die bisherige Statistik verloren, keine funktionalen Daten).
// -----------------------------------------------------------------------------
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { AiProvider } from "@/lib/settings/aiService";

export type AiUsageAction = "POLISH_COVER_LETTER" | "EVALUATE_INTERVIEW_ANSWER" | "GENERATE_OPENING_SENTENCE";

export type AiUsageEntry = {
  timestamp: string; // ISO
  provider: AiProvider | string;
  model: string;
  action: AiUsageAction;
  promptTokens: number;
  completionTokens: number;
  /** null = Provider/Modell nicht in der Preistabelle -> keine Schätzung möglich (s. estimateCostUsd). */
  estimatedCostUsd: number | null;
};

export type AiUsageSummary = {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  /** Summe aller SCHÄTZBAREN Kosten — Einträge ohne bekannte Preistabelle fließen mit 0 ein, s. `hasUnknownPricing`. */
  totalEstimatedCostUsd: number;
  /** true, falls mind. ein Request mit einem Provider/Modell ohne Preistabelle protokolliert wurde (z.B. OpenRouter). */
  hasUnknownPricing: boolean;
  byProvider: Record<string, { requests: number; totalTokens: number; estimatedCostUsd: number }>;
  /** Neueste zuerst, auf MAX_RECENT_ENTRIES begrenzt (Tabelle in der Einstellungen-UI). */
  recentEntries: AiUsageEntry[];
  /** Requests/Kosten NUR des laufenden Kalendermonats — Basis für das optionale Budget-Limit (s. src/lib/aiBudget.ts). */
  currentMonthRequests: number;
  currentMonthEstimatedCostUsd: number;
  currentMonthHasUnknownPricing: boolean;
};

const USAGE_FILE_PATH = path.join(process.cwd(), ".ai-usage.json");
const MAX_STORED_ENTRIES = 500; // begrenzt Dateiwachstum, für die Kostenübersicht mehr als ausreichend
const MAX_RECENT_ENTRIES = 20;

// -----------------------------------------------------------------------------
// Geschätzte Preise in USD je 1 Mio. Tokens (Stand: öffentlich bekannte
// Listenpreise der Provider, Anfang 2026) — NUR eine grobe Orientierung,
// keine Garantie: die tatsächliche Abrechnung hängt vom individuellen
// Vertrag/Rabatt beim jeweiligen Provider ab und ändert sich regelmäßig.
// OpenRouter wird bewusst NICHT geschätzt: Dort variiert der Preis je nach
// dahinterliegendem Modell um Größenordnungen — eine pauschale Zahl wäre
// irreführender als gar keine.
// -----------------------------------------------------------------------------
const PRICING_PER_MILLION_TOKENS: { match: RegExp; inputUsd: number; outputUsd: number }[] = [
  { match: /gpt-4o-mini/i, inputUsd: 0.15, outputUsd: 0.6 },
  { match: /gpt-4o/i, inputUsd: 2.5, outputUsd: 10 },
  { match: /gpt-4\.1-mini/i, inputUsd: 0.4, outputUsd: 1.6 },
  { match: /gpt-4\.1/i, inputUsd: 2, outputUsd: 8 },
  { match: /claude-3-5-haiku|claude-3\.5-haiku/i, inputUsd: 0.8, outputUsd: 4 },
  { match: /claude-3-5-sonnet|claude-3\.5-sonnet|claude-sonnet/i, inputUsd: 3, outputUsd: 15 },
  { match: /claude-3-opus|claude-opus/i, inputUsd: 15, outputUsd: 75 },
  { match: /claude-3-haiku/i, inputUsd: 0.25, outputUsd: 1.25 },
];

/**
 * Schätzt die Kosten eines einzelnen Requests in USD. Gibt `null` zurück,
 * wenn Provider/Modell nicht eindeutig zugeordnet werden kann — Ollama läuft
 * rein lokal und kostet immer 0, OpenRouter/unbekannte Modelle werden bewusst
 * NICHT geschätzt statt eine falsche Zahl vorzutäuschen.
 */
export function estimateCostUsd(
  provider: AiProvider | string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number | null {
  if (provider === "ollama") return 0;
  if (provider === "openrouter") return null;

  const pricing = PRICING_PER_MILLION_TOKENS.find((p) => p.match.test(model));
  if (!pricing) return null;

  return (promptTokens / 1_000_000) * pricing.inputUsd + (completionTokens / 1_000_000) * pricing.outputUsd;
}

function loadEntries(): AiUsageEntry[] {
  if (!existsSync(USAGE_FILE_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(USAGE_FILE_PATH, "utf-8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // beschädigte Datei -> verwirft nur die Statistik, kein funktionaler Datenverlust
  }
}

function saveEntries(entries: AiUsageEntry[]): void {
  try {
    writeFileSync(USAGE_FILE_PATH, JSON.stringify(entries, null, 2), { mode: 0o600 });
  } catch {
    // z.B. read-only Dateisystem in manchen Hosting-Umgebungen — die
    // Statistik bleibt dann nur für die Laufzeit dieses Prozesses erhalten,
    // kein funktionales Feature der App hängt davon ab.
    console.warn(`aiUsageTracker: Konnte Nutzungsstatistik nicht unter ${USAGE_FILE_PATH} persistieren.`);
  }
}

/** Protokolliert einen tatsächlich ausgeführten (nicht auf die Heuristik zurückgefallenen) KI-Request. */
export function recordAiUsage(entry: Omit<AiUsageEntry, "timestamp" | "estimatedCostUsd">): void {
  const fullEntry: AiUsageEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    estimatedCostUsd: estimateCostUsd(entry.provider, entry.model, entry.promptTokens, entry.completionTokens),
  };

  const entries = loadEntries();
  entries.push(fullEntry);
  // Älteste zuerst verwerfen, sobald das Limit überschritten ist.
  saveEntries(entries.slice(-MAX_STORED_ENTRIES));
}

/**
 * Aggregiert ein Nutzungsprotokoll für die Einstellungen-UI. Nimmt die
 * Einträge bewusst als Parameter entgegen (statt sie selbst zu laden) —
 * hält die eigentliche Aggregationslogik dateisystemfrei und damit ohne
 * Mocking testbar; `getAiUsageSummary()` unten ist der dünne I/O-Wrapper.
 */
export function summarizeAiUsage(entries: AiUsageEntry[], referenceDate: Date = new Date()): AiUsageSummary {
  const byProvider: AiUsageSummary["byProvider"] = {};
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalEstimatedCostUsd = 0;
  let hasUnknownPricing = false;

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  let currentMonthRequests = 0;
  let currentMonthEstimatedCostUsd = 0;
  let currentMonthHasUnknownPricing = false;

  for (const entry of entries) {
    totalPromptTokens += entry.promptTokens;
    totalCompletionTokens += entry.completionTokens;
    if (entry.estimatedCostUsd === null) {
      hasUnknownPricing = true;
    } else {
      totalEstimatedCostUsd += entry.estimatedCostUsd;
    }

    const bucket = byProvider[entry.provider] ?? { requests: 0, totalTokens: 0, estimatedCostUsd: 0 };
    bucket.requests += 1;
    bucket.totalTokens += entry.promptTokens + entry.completionTokens;
    bucket.estimatedCostUsd += entry.estimatedCostUsd ?? 0;
    byProvider[entry.provider] = bucket;

    const entryDate = new Date(entry.timestamp);
    if (entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth) {
      currentMonthRequests += 1;
      if (entry.estimatedCostUsd === null) {
        currentMonthHasUnknownPricing = true;
      } else {
        currentMonthEstimatedCostUsd += entry.estimatedCostUsd;
      }
    }
  }

  return {
    totalRequests: entries.length,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens: totalPromptTokens + totalCompletionTokens,
    totalEstimatedCostUsd,
    hasUnknownPricing,
    byProvider,
    recentEntries: [...entries].reverse().slice(0, MAX_RECENT_ENTRIES),
    currentMonthRequests,
    currentMonthEstimatedCostUsd,
    currentMonthHasUnknownPricing,
  };
}

/** Liest das komplette Nutzungsprotokoll von der Festplatte und aggregiert es (siehe `summarizeAiUsage`). */
export function getAiUsageSummary(): AiUsageSummary {
  return summarizeAiUsage(loadEntries());
}

/** Löscht die gesamte Nutzungsstatistik (Einstellungen -> "Statistik zurücksetzen"). */
export function clearAiUsage(): void {
  saveEntries([]);
}
