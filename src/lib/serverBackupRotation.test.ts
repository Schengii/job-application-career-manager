import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { createAutoSnapshot } from "./serverBackupRotation";
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
