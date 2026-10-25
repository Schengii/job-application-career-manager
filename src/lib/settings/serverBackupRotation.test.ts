import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/core/prisma";
import { createAutoSnapshot, createPeriodicSnapshotIfDue } from "@/lib/settings/serverBackupRotation";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";

describe.skipIf(!process.env.TEST_DATABASE_URL)("serverBackupRotation", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("legt vor einer destruktiven Aktion einen JSON-Snapshot des aktuellen Datenbestands an", async () => {
    await createTestCompany({ name: "Snapshot GmbH" });

    await createAutoSnapshot("bulk-delete-test");

    const snapshots = await prisma.backupSnapshot.findMany();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].label).toBe("bulk-delete-test");

    const content = snapshots[0].data as { companies: { name: string }[] };
    expect(content.companies).toHaveLength(1);
    expect(content.companies[0].name).toBe("Snapshot GmbH");
  });

  it("rotiert alte Auto-Snapshots und behält nur die neuesten 10", async () => {
    for (let i = 0; i < 12; i++) {
      await createAutoSnapshot(`snapshot-${i}`);
    }

    expect(await prisma.backupSnapshot.count()).toBe(10);
  });

  it("wirft keinen Fehler, wenn das Schreiben fehlschlägt (best-effort)", async () => {
    vi.spyOn(prisma.backupSnapshot, "create").mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(createAutoSnapshot("should-not-throw")).resolves.toBeUndefined();

    vi.restoreAllMocks();
  });
});

describe.skipIf(!process.env.TEST_DATABASE_URL)("createPeriodicSnapshotIfDue", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("legt einen Snapshot an, wenn noch nie einer existiert hat", async () => {
    await createPeriodicSnapshotIfDue();

    const snapshots = await prisma.backupSnapshot.findMany();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].label).toBe("scheduled");
  });

  it("legt KEINEN neuen Snapshot an, wenn der letzte periodische Snapshot jünger als 24h ist", async () => {
    await createPeriodicSnapshotIfDue();
    await createPeriodicSnapshotIfDue();

    expect(await prisma.backupSnapshot.count()).toBe(1);
  });

  it("legt erneut einen Snapshot an, wenn der letzte periodische Snapshot älter als 24h ist", async () => {
    await createPeriodicSnapshotIfDue();

    // Simuliert "vor über 24h geschrieben", ohne 24h warten zu müssen.
    await prisma.backupSnapshot.updateMany({
      data: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    });

    await createPeriodicSnapshotIfDue();

    expect(await prisma.backupSnapshot.count()).toBe(2);
  });

  it("wirft keinen Fehler, wenn das Schreiben fehlschlägt (best-effort)", async () => {
    vi.spyOn(prisma.backupSnapshot, "findFirst").mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(createPeriodicSnapshotIfDue()).resolves.toBeUndefined();

    vi.restoreAllMocks();
  });
});
