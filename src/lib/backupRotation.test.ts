import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  saveRotatedBackup,
  getRotatedBackups,
  deleteRotatedBackup,
  formatBackupSize,
} from "./backupRotation";
import type { BackupData } from "./backup";

describe("backupRotation Engine", () => {
  const dummyBackup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    preferences: {},
    educationEntries: [],
    projectEntries: [],
    companies: [],
    jobPostings: [],
    applications: [],
    documents: [],
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

  it("speichert und rotiert Backups im Snapshot-Speicher", () => {
    const list1 = saveRotatedBackup(dummyBackup, "Test-Backup 1");
    expect(list1.length).toBe(1);
    expect(list1[0].label).toBe("Test-Backup 1");

    const loaded = getRotatedBackups();
    expect(loaded.length).toBe(1);
  });

  it("limitiert die Anzahl gespeicherter Snapshots auf maximal 5", () => {
    for (let i = 1; i <= 7; i++) {
      saveRotatedBackup(dummyBackup, `Backup ${i}`);
    }

    const current = getRotatedBackups();
    expect(current.length).toBe(5);
    expect(current[0].label).toBe("Backup 7");
  });

  it("löscht gezielt ein Snapshot", () => {
    saveRotatedBackup(dummyBackup, "Sicherung A");
    const list = saveRotatedBackup(dummyBackup, "Sicherung B");
    const idToDelete = list[0].id;

    const remaining = deleteRotatedBackup(idToDelete);
    expect(remaining.length).toBe(1);
    expect(remaining[0].label).toBe("Sicherung A");
  });

  it("formatiert Dateigrößen lesbar", () => {
    expect(formatBackupSize(500)).toBe("500 B");
    expect(formatBackupSize(2048)).toBe("2.0 KB");
    expect(formatBackupSize(2097152)).toBe("2.0 MB");
  });
});
