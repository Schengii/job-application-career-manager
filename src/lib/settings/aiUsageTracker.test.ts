import { describe, it, expect } from "vitest";
import { estimateCostUsd, summarizeAiUsage, type AiUsageEntry } from "@/lib/settings/aiUsageTracker";

function entry(overrides: Partial<AiUsageEntry> = {}): AiUsageEntry {
  const base = {
    timestamp: "2026-01-01T00:00:00.000Z",
    provider: "openai",
    model: "gpt-4o-mini",
    action: "POLISH_COVER_LETTER" as const,
    promptTokens: 1000,
    completionTokens: 500,
  };
  // `estimatedCostUsd` wird bewusst NACH dem Merge aus den (ggf.
  // überschriebenen) provider/model/token-Feldern neu berechnet, statt einen
  // festen Default zu übernehmen — sonst würde z.B. `entry({ promptTokens: 2000 })`
  // weiterhin die Kosten für 1000 Tokens tragen.
  const merged = { ...base, ...overrides };
  return {
    ...merged,
    estimatedCostUsd:
      overrides.estimatedCostUsd !== undefined
        ? overrides.estimatedCostUsd
        : estimateCostUsd(merged.provider, merged.model, merged.promptTokens, merged.completionTokens),
  };
}

describe("estimateCostUsd", () => {
  it("berechnet Kosten für ein bekanntes OpenAI-Modell aus Prompt-/Completion-Tokens", () => {
    // gpt-4o-mini: $0.15/1M Input, $0.60/1M Output
    const cost = estimateCostUsd("openai", "gpt-4o-mini", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.15 + 0.6, 5);
  });

  it("berechnet Kosten für ein bekanntes Anthropic-Modell", () => {
    const cost = estimateCostUsd("anthropic", "claude-3-5-sonnet-20241022", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(3 + 15, 5);
  });

  it("liefert 0 für Ollama, unabhängig vom Modellnamen (immer lokal, keine Kosten)", () => {
    expect(estimateCostUsd("ollama", "llama3.1", 999_999, 999_999)).toBe(0);
  });

  it("liefert null für OpenRouter (Preis variiert zu stark je nach Modell, um pauschal zu schätzen)", () => {
    expect(estimateCostUsd("openrouter", "meta-llama/llama-3-8b-instruct", 1000, 1000)).toBeNull();
  });

  it("liefert null für ein unbekanntes Modell eines ansonsten unterstützten Providers", () => {
    expect(estimateCostUsd("openai", "ein-ganz-neues-modell-xyz", 1000, 1000)).toBeNull();
  });
});

describe("summarizeAiUsage", () => {
  it("liefert leere Summary für ein leeres Nutzungsprotokoll", () => {
    const summary = summarizeAiUsage([]);
    expect(summary.totalRequests).toBe(0);
    expect(summary.totalTokens).toBe(0);
    expect(summary.totalEstimatedCostUsd).toBe(0);
    expect(summary.hasUnknownPricing).toBe(false);
    expect(summary.byProvider).toEqual({});
    expect(summary.recentEntries).toEqual([]);
  });

  it("summiert Tokens und Kosten über mehrere Einträge hinweg", () => {
    const entries = [
      entry({ promptTokens: 100, completionTokens: 50 }),
      entry({ promptTokens: 200, completionTokens: 100 }),
    ];
    const summary = summarizeAiUsage(entries);

    expect(summary.totalRequests).toBe(2);
    expect(summary.totalPromptTokens).toBe(300);
    expect(summary.totalCompletionTokens).toBe(150);
    expect(summary.totalTokens).toBe(450);
    expect(summary.totalEstimatedCostUsd).toBeGreaterThan(0);
  });

  it("markiert hasUnknownPricing, wenn mind. ein Eintrag keine Preisschätzung hat, zählt dessen Tokens aber trotzdem mit", () => {
    const entries = [
      entry({ provider: "openrouter", model: "some/model", estimatedCostUsd: null, promptTokens: 500, completionTokens: 500 }),
    ];
    const summary = summarizeAiUsage(entries);

    expect(summary.hasUnknownPricing).toBe(true);
    expect(summary.totalTokens).toBe(1000);
    expect(summary.totalEstimatedCostUsd).toBe(0);
  });

  it("gruppiert korrekt nach Provider", () => {
    const entries = [
      entry({ provider: "openai" }),
      entry({ provider: "openai" }),
      entry({ provider: "anthropic", model: "claude-3-5-sonnet-20241022", estimatedCostUsd: estimateCostUsd("anthropic", "claude-3-5-sonnet-20241022", 1000, 500) }),
    ];
    const summary = summarizeAiUsage(entries);

    expect(summary.byProvider.openai.requests).toBe(2);
    expect(summary.byProvider.anthropic.requests).toBe(1);
    expect(Object.keys(summary.byProvider).sort()).toEqual(["anthropic", "openai"]);
  });

  it("liefert die neuesten Einträge zuerst und begrenzt recentEntries", () => {
    const entries = Array.from({ length: 25 }, (_, i) =>
      entry({ timestamp: `2026-01-01T00:00:${String(i).padStart(2, "0")}.000Z` })
    );
    const summary = summarizeAiUsage(entries);

    expect(summary.recentEntries.length).toBe(20);
    // Letzter erzeugter Eintrag (höchste Sekunde) muss zuerst stehen.
    expect(summary.recentEntries[0].timestamp).toBe("2026-01-01T00:00:24.000Z");
  });

  // Bewusst Zeitpunkte TIEF innerhalb des jeweiligen Monats (Tag 15, lokale
  // Zeit via `new Date(Jahr, MonatIndex, Tag)`) statt Monatsgrenzen wie
  // "31.03. 23:59 UTC" — Letzteres kippt je nach Zeitzone des Testrechners
  // (z.B. CEST = UTC+2) in den Folgemonat, weil summarizeAiUsage bewusst
  // lokale Zeit verwendet (passend zum "Kalendermonat aus Nutzersicht" einer
  // Single-User-Lokal-App, analog zu src/lib/eigenbemuehungenReport.ts).
  it("zählt nur Einträge des per referenceDate übergebenen Kalendermonats in die currentMonth-Felder", () => {
    const referenceDate = new Date(2026, 2, 15); // März 2026
    const entries = [
      entry({ timestamp: new Date(2026, 2, 5).toISOString(), promptTokens: 1000, completionTokens: 1000 }),
      entry({ timestamp: new Date(2026, 2, 25).toISOString(), promptTokens: 1000, completionTokens: 1000 }),
      entry({ timestamp: new Date(2026, 1, 15).toISOString() }), // Vormonat (Februar) -> zählt nicht mit
      entry({ timestamp: new Date(2026, 3, 15).toISOString() }), // Folgemonat (April) -> zählt nicht mit
    ];

    const summary = summarizeAiUsage(entries, referenceDate);

    expect(summary.totalRequests).toBe(4);
    expect(summary.currentMonthRequests).toBe(2);
    // Nur die beiden März-Einträge fließen in die Monatskosten ein.
    const marchCost =
      estimateCostUsd("openai", "gpt-4o-mini", 1000, 1000)! + estimateCostUsd("openai", "gpt-4o-mini", 1000, 1000)!;
    expect(summary.currentMonthEstimatedCostUsd).toBeCloseTo(marchCost, 5);
  });

  it("markiert currentMonthHasUnknownPricing unabhängig von Einträgen außerhalb des Monats", () => {
    const referenceDate = new Date(2026, 2, 15); // März 2026
    const entries = [
      entry({
        timestamp: new Date(2026, 2, 10).toISOString(),
        provider: "openrouter",
        model: "some/model",
        estimatedCostUsd: null,
      }),
      entry({ timestamp: new Date(2026, 1, 10).toISOString(), provider: "openrouter", model: "some/model", estimatedCostUsd: null }),
    ];

    const summary = summarizeAiUsage(entries, referenceDate);

    expect(summary.currentMonthRequests).toBe(1);
    expect(summary.currentMonthHasUnknownPricing).toBe(true);
    expect(summary.currentMonthEstimatedCostUsd).toBe(0);
  });
});
