// -----------------------------------------------------------------------------
// Integrationstest: /api/applications/bulk (Stapel-Aktionen & Zeilen-Batch)
// -----------------------------------------------------------------------------
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { POST } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/core/prisma";

const BACKUP_DIR = path.join(process.cwd(), "backups");

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/applications/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/applications/bulk", () => {
  beforeEach(async () => {
    await resetDb();
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
  });

  afterEach(async () => {
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
  });

  it("DELETE löscht die angegebenen Bewerbungen und legt vorher einen Auto-Snapshot an", async () => {
    const company = await createTestCompany();
    const app1 = await prisma.application.create({ data: { position: "A", companyId: company.id } });
    const app2 = await prisma.application.create({ data: { position: "B", companyId: company.id } });

    const response = await POST(
      postRequest({ action: "DELETE", applicationIds: [app1.id, app2.id] })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.count).toBe(2);

    const remaining = await prisma.application.findMany();
    expect(remaining).toHaveLength(0);

    const snapshotFiles = await fs.readdir(BACKUP_DIR);
    const autoSnapshots = snapshotFiles.filter((f) => f.startsWith("auto-"));
    expect(autoSnapshots.length).toBe(1);
    expect(autoSnapshots[0]).toContain("bulk-delete-2-applications");

    // Der Snapshot muss die Bewerbungen VOR der Löschung enthalten.
    const snapshot = JSON.parse(await fs.readFile(path.join(BACKUP_DIR, autoSnapshots[0]), "utf-8"));
    expect(snapshot.applications).toHaveLength(2);
  });

  it("APPLY_STANDARD_PACKAGE hängt Standard-Dokumente an und generiert fehlende Anschreiben, ohne Vorhandenes zu überschreiben", async () => {
    const company = await createTestCompany();
    const cv = await prisma.document.create({ data: { name: "Lebenslauf", category: "LEBENSLAUF", isDefault: true } });
    await prisma.document.create({ data: { name: "Sonstiges", category: "SONSTIGES", isDefault: false } });

    const appWithoutLetter = await prisma.application.create({ data: { position: "A", companyId: company.id } });
    const appWithLetter = await prisma.application.create({ data: { position: "B", companyId: company.id } });
    await prisma.coverLetter.create({
      data: { applicationId: appWithLetter.id, content: "Bereits vorhandenes, individuelles Anschreiben", status: "SENT" },
    });

    const response = await POST(
      postRequest({ action: "APPLY_STANDARD_PACKAGE", applicationIds: [appWithoutLetter.id, appWithLetter.id] })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.documentsAttached).toBe(2); // ein Standard-Dokument je Bewerbung
    expect(body.coverLettersGenerated).toBe(1); // nur die Bewerbung ohne bestehendes Anschreiben

    const docsForBoth = await prisma.applicationDocument.findMany();
    expect(docsForBoth.every((d) => d.documentId === cv.id)).toBe(true);
    expect(docsForBoth).toHaveLength(2);

    const untouchedLetter = await prisma.coverLetter.findUnique({ where: { applicationId: appWithLetter.id } });
    expect(untouchedLetter?.content).toBe("Bereits vorhandenes, individuelles Anschreiben");
    expect(untouchedLetter?.status).toBe("SENT");

    const newLetter = await prisma.coverLetter.findUnique({ where: { applicationId: appWithoutLetter.id } });
    expect(newLetter).not.toBeNull();
    expect(newLetter?.status).toBe("DRAFT");
  });

  it("APPLY_STANDARD_PACKAGE hängt ein Standard-Dokument nicht doppelt an, wenn es bereits angehängt ist", async () => {
    const company = await createTestCompany();
    const cv = await prisma.document.create({ data: { name: "Lebenslauf", category: "LEBENSLAUF", isDefault: true } });
    const app = await prisma.application.create({ data: { position: "A", companyId: company.id } });
    await prisma.applicationDocument.create({ data: { applicationId: app.id, documentId: cv.id } });

    const response = await POST(postRequest({ action: "APPLY_STANDARD_PACKAGE", applicationIds: [app.id] }));
    const body = await response.json();

    expect(body.documentsAttached).toBe(0);
    expect(await prisma.applicationDocument.count()).toBe(1);
  });
});
