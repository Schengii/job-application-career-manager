import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  getSavedFilters,
  saveFilterPreset,
  deleteFilterPreset,
  type SavedFilterValues,
} from "./savedFilters";

describe("savedFilters Engine", () => {
  const dummyFilters: SavedFilterValues = {
    status: "SENT",
    portal: "ALL",
    tag: "ALL",
    search: "",
    onlyFollowUps: false,
    sortBy: "DATE_DESC",
  };

  // Mock-Implementierung von localStorage im Node Test Environment
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

  it("speichert und listet Presets", () => {
    const list = saveFilterPreset("Nur Vorstellungsgespräche", dummyFilters);
    expect(list.length).toBe(1);
    expect(list[0].name).toBe("Nur Vorstellungsgespräche");
    expect(list[0].filters).toEqual(dummyFilters);

    const loaded = getSavedFilters();
    expect(loaded.length).toBe(1);
  });

  it("ersetzt ein Preset mit gleichem Namen statt es zu duplizieren", () => {
    saveFilterPreset("Meine Ansicht", dummyFilters);
    const updated = saveFilterPreset("meine ansicht", { ...dummyFilters, status: "OFFER" });

    expect(updated.length).toBe(1);
    expect(updated[0].filters.status).toBe("OFFER");
  });

  it("ignoriert leere/nur-Leerzeichen-Namen", () => {
    const list = saveFilterPreset("   ", dummyFilters);
    expect(list.length).toBe(0);
  });

  it("begrenzt die Anzahl gespeicherter Presets auf 20", () => {
    for (let i = 1; i <= 25; i++) {
      saveFilterPreset(`Preset ${i}`, dummyFilters);
    }
    const current = getSavedFilters();
    expect(current.length).toBe(20);
    expect(current[0].name).toBe("Preset 25");
  });

  it("löscht gezielt ein Preset", () => {
    saveFilterPreset("A", dummyFilters);
    const list = saveFilterPreset("B", dummyFilters);
    const idToDelete = list[0].id;

    const remaining = deleteFilterPreset(idToDelete);
    expect(remaining.length).toBe(1);
    expect(remaining[0].name).toBe("A");
  });
});
