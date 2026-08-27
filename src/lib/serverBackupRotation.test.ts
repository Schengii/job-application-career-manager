import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { createAutoSnapshot, createPeriodicSnapshotIfDue } from "./serverBackupRotation";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";

const BACKUP_DIR = path.join(process.cwd(), "backups");

async function listAutoSnapshots(): Promise<string[]> {
  try {
    const entries = await fs.readdir(BACKUP_DIR);
    return entries.filter((f) => f.startsWith("auto-") && f.endsWith(".json"));
  } catch {
    return [];
  }
}

describe("serverBackupRotation", () => {
  beforeEach(async () => {
    await resetDb();
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
  });

  afterEach(async () => {
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
  });

  it("legt vor einer destruktiven Aktion einen JSON-Snapshot des aktuellen Datenbestands an", async () => {
    await createTestCompany({ name: "Snapshot GmbH" });

    await createAutoSnapshot("bulk-delete-test");

    const files = await listAutoSnapshots();
    expect(files.length).toBe(1);
    expect(files[0]).toContain("bulk-delete-test");

    const content = JSON.parse(await fs.readFile(path.join(BACKUP_DIR, files[0]), "utf-8"));
    expect(content.companies).toHaveLength(1);
    expect(content.companies[0].name).toBe("Snapshot GmbH");
  });

  it("rotiert alte Auto-Snapshots und behält nur die neuesten 10", async () => {
    for (let i = 0; i < 12; i++) {
      await createAutoSnapshot(`snapshot-${i}`);
    }

    const files = await listAutoSnapshots();
    expect(files.length).toBe(10);
  });

  it("wirft keinen Fehler, wenn das Schreiben fehlschlägt (best-effort)", async () => {
    // BACKUP_DIR als Datei statt Verzeichnis anlegen -> mkdir({recursive:true}) schlägt fehl
    await fs.writeFile(BACKUP_DIR, "not a directory");

    await expect(createAutoSnapshot("should-not-throw")).resolves.toBeUndefined();

    await fs.rm(BACKUP_DIR, { force: true });
  });
});

describe("createPeriodicSnapshotIfDue", () => {
  beforeEach(async () => {
    await resetDb();
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
  });

  afterEach(async () => {
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
  });

  it("legt einen Snapshot an, wenn noch nie einer existiert hat", async () => {
    await createPeriodicSnapshotIfDue();

    const files = await listAutoSnapshots();
    expect(files).toHaveLength(1);
    expect(files[0]).toContain("scheduled");
  });

  it("legt KEINEN neuen Snapshot an, wenn der letzte periodische Snapshot jünger als 24h ist", async () => {
    await createPeriodicSnapshotIfDue();
    const filesAfterFirst = await listAutoSnapshots();
    expect(filesAfterFirst).toHaveLength(1);

    await createPeriodicSnapshotIfDue();

    const filesAfterSecond = await listAutoSnapshots();
    expect(filesAfterSecond).toHaveLength(1); // unverändert, kein zweiter Snapshot
  });

  it("legt erneut einen Snapshot an, wenn der letzte periodische Snapshot älter als 24h ist", async () => {
    await createPeriodicSnapshotIfDue();
    const [existing] = await listAutoSnapshots();

    // Simuliert "vor über 24h geschrieben", ohne 24h warten zu müssen.
    const staleTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await fs.utimes(path.join(BACKUP_DIR, existing), staleTime, staleTime);

    await createPeriodicSnapshotIfDue();

    const filesAfter = await listAutoSnapshots();
    expect(filesAfter).toHaveLength(2);
  });

  it("wirft keinen Fehler, wenn das Schreiben fehlschlägt (best-effort)", async () => {
    await fs.writeFile(BACKUP_DIR, "not a directory");

    await expect(createPeriodicSnapshotIfDue()).resolves.toBeUndefined();

    await fs.rm(BACKUP_DIR, { force: true });
  });
});
