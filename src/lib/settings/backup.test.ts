// -----------------------------------------------------------------------------
// Integrationstest: Backup-Export & -Restore (src/lib/backup.ts)
// -----------------------------------------------------------------------------
// Deckt zwei Sicherheits-/Robustheits-Eigenschaften ab, die zuvor ungetestet
// waren:
// 1. `createFullBackup()` darf den KI-API-Key niemals mit exportieren.
// 2. `restoreFromBackup()` validiert die Eingabe über Zod (siehe
//    `backupSchema` in validation.ts) und lehnt strukturell ungültige oder
//    versionsinkompatible Dateien mit einem ZodError ab, statt sie über
//    unsichere Type-Casts stillschweigend in die Datenbank zu schreiben.
// -----------------------------------------------------------------------------
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { createFullBackup, restoreFromBackup } from "@/lib/settings/backup";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/core/prisma";

// `restoreFromBackup()` legt seit src/lib/serverBackupRotation.ts vor jedem
// Restore einen Auto-Snapshot unter ./backups/ an — hier nur aufgeräumt,
// damit Testläufe keine Dateien im Arbeitsverzeichnis hinterlassen (der
// Ordner ist ohnehin über .gitignore ausgeschlossen).
const BACKUP_DIR = path.join(process.cwd(), "backups");

describe("createFullBackup", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("exportiert die Präferenzen ohne den aiApiKey", async () => {
    await prisma.preferences.create({
      data: { id: "default", fullName: "Max Mustermann", aiApiKey: "sk-should-never-leave-the-server" },
    });

    const backup = await createFullBackup();

    expect(backup.preferences).not.toHaveProperty("aiApiKey");
    expect(JSON.stringify(backup)).not.toContain("sk-should-never-leave-the-server");
    expect((backup.preferences as { fullName?: string } | null)?.fullName).toBe("Max Mustermann");
  });

  it("exportiert die Präferenzen ohne das imapPassword", async () => {
    await prisma.preferences.create({
      data: { id: "default", imapHost: "imap.example.com", imapPassword: "app-password-should-never-leave-the-server" },
    });

    const backup = await createFullBackup();

    expect(backup.preferences).not.toHaveProperty("imapPassword");
    expect(JSON.stringify(backup)).not.toContain("app-password-should-never-leave-the-server");
  });

  it("liefert version: 1 und leere Arrays statt undefined für eine frische Datenbank", async () => {
    const backup = await createFullBackup();
    expect(backup.version).toBe(1);
    expect(backup.companies).toEqual([]);
    expect(backup.applications).toEqual([]);
  });
});

describe("restoreFromBackup", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
  });

  it("lehnt eine inkompatible Backup-Version ab", async () => {
    await expect(restoreFromBackup({ version: 2, companies: [] })).rejects.toThrow(ZodError);
  });

  it("lehnt strukturell ungültige Daten ab (companies ist kein Array)", async () => {
    await expect(restoreFromBackup({ version: 1, companies: "not-an-array" })).rejects.toThrow(ZodError);
  });

  it("lehnt einen Company-Eintrag ohne id ab, statt ihn stillschweigend zu überspringen", async () => {
    await expect(
      restoreFromBackup({ version: 1, companies: [{ name: "Firma ohne ID" }] })
    ).rejects.toThrow(ZodError);
  });

  it("stellt Unternehmen inkl. tags wieder her (frühere Version ließ tags beim Restore verloren gehen)", async () => {
    const result = await restoreFromBackup({
      version: 1,
      companies: [{ id: "test-company-1", name: "Acme GmbH", tags: "Prio1,Remote" }],
    });

    expect(result.stats.companies).toBe(1);
    const stored = await prisma.company.findUnique({ where: { id: "test-company-1" } });
    expect(stored?.tags).toBe("Prio1,Remote");
  });

  it("stellt Bewerbungen inkl. meetingUrl/rejectionReason/tags wieder her", async () => {
    const company = await createTestCompany();

    const result = await restoreFromBackup({
      version: 1,
      applications: [
        {
          id: "test-app-1",
          position: "Frontend-Entwickler",
          status: "REJECTED",
          companyId: company.id,
          meetingUrl: "https://meet.example.com/abc",
          rejectionReason: "Gehaltsvorstellung nicht vereinbar",
          tags: "Prio1",
        },
      ],
    });

    expect(result.stats.applications).toBe(1);
    const stored = await prisma.application.findUnique({ where: { id: "test-app-1" } });
    expect(stored?.meetingUrl).toBe("https://meet.example.com/abc");
    expect(stored?.rejectionReason).toBe("Gehaltsvorstellung nicht vereinbar");
    expect(stored?.tags).toBe("Prio1");
  });

  it("restauriert Präferenzen ohne einen zuvor gespeicherten aiApiKey zu löschen", async () => {
    await prisma.preferences.create({
      data: { id: "default", fullName: "Alter Name", aiApiKey: "sk-bleibt-erhalten" },
    });

    await restoreFromBackup({ version: 1, preferences: { fullName: "Neuer Name" } });

    const stored = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(stored?.fullName).toBe("Neuer Name");
    expect(stored?.aiApiKey).toBe("sk-bleibt-erhalten");
  });

  it("restauriert Präferenzen ohne ein zuvor gespeichertes imapPassword zu löschen", async () => {
    await prisma.preferences.create({
      data: { id: "default", fullName: "Alter Name", imapPassword: "app-password-bleibt-erhalten" },
    });

    await restoreFromBackup({ version: 1, preferences: { fullName: "Neuer Name" } });

    const stored = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(stored?.fullName).toBe("Neuer Name");
    expect(stored?.imapPassword).toBe("app-password-bleibt-erhalten");
  });
});
