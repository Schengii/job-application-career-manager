import { describe, expect, it, beforeEach, vi } from "vitest";
import { getAiMonthlyBudgetUsd, setAiMonthlyBudgetUsd } from "./aiBudget";

describe("aiBudget", () => {
  // Mock-Implementierung von localStorage im Node Test Environment (analog zu savedFilters.test.ts)
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };

    vi.stubGlobal("localStorage", mockStorage);
    vi.stubGlobal("window", {});
  });

  it("liefert null, wenn kein Limit gesetzt ist", () => {
    expect(getAiMonthlyBudgetUsd()).toBeNull();
  });

  it("speichert und liest ein gesetztes Limit", () => {
    setAiMonthlyBudgetUsd(25);
    expect(getAiMonthlyBudgetUsd()).toBe(25);
  });

  it("löscht das Limit, wenn null übergeben wird", () => {
    setAiMonthlyBudgetUsd(10);
    setAiMonthlyBudgetUsd(null);
    expect(getAiMonthlyBudgetUsd()).toBeNull();
  });

  it("behandelt 0 und negative Werte wie 'kein Limit' (löscht den gespeicherten Wert)", () => {
    setAiMonthlyBudgetUsd(10);
    setAiMonthlyBudgetUsd(0);
    expect(getAiMonthlyBudgetUsd()).toBeNull();

    setAiMonthlyBudgetUsd(10);
    setAiMonthlyBudgetUsd(-5);
    expect(getAiMonthlyBudgetUsd()).toBeNull();
  });

  it("ignoriert einen beschädigten/nicht-numerischen gespeicherten Wert", () => {
    store["career_manager_ai_monthly_budget_usd"] = "kein-limit-mehr-gültig";
    expect(getAiMonthlyBudgetUsd()).toBeNull();
  });
});
