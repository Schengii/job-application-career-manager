// -----------------------------------------------------------------------------
// Integrationstest: POST /api/jobs/:id/apply
// -----------------------------------------------------------------------------
// Prüft insbesondere das automatische "Standard-Bewerbungspaket": als
// Document.isDefault markierte Dokumente werden angehängt und ein Anschreiben
// wird direkt beim Bewerben generiert (inkl. Firmen-Vorlage, falls hinterlegt).
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function callApply(jobId: string) {
  const request = new Request(`http://localhost/api/jobs/${jobId}/apply`, { method: "POST" });
  const params: Params = { params: Promise.resolve({ id: jobId }) };
  return POST(request as never, params);
}

describe("POST /api/jobs/:id/apply", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("hängt alle als Standard markierten Dokumente automatisch an die neue Bewerbung an", async () => {
    const company = await createTestCompany({ name: "Standard-Paket GmbH" });
    const job = await prisma.jobPosting.create({
      data: { title: "Frontend Entwickler", description: "…", portalSource: "OTHER", companyId: company.id },
    });
    const cv = await prisma.document.create({
      data: { name: "Lebenslauf 2026", category: "LEBENSLAUF", isDefault: true },
    });
    // Nicht als Standard markiertes Dokument darf NICHT automatisch angehängt werden.
    await prisma.document.create({
      data: { name: "Sonstiges Zertifikat", category: "SONSTIGES", isDefault: false },
    });

    const response = await callApply(job.id);
    expect(response.status).toBe(201);
    const body = await response.json();

    expect(body.documents).toHaveLength(1);
    expect(body.documents[0].documentId).toBe(cv.id);
  });

  it("generiert automatisch ein Anschreiben im Status DRAFT", async () => {
    const company = await createTestCompany({ name: "Autogenerierte Anschreiben AG" });
    const job = await prisma.jobPosting.create({
      data: { title: "Backend Entwickler", description: "…", portalSource: "OTHER", companyId: company.id },
    });

    const response = await callApply(job.id);
    const body = await response.json();

    expect(body.coverLetter).toBeTruthy();
    expect(body.coverLetter.status).toBe("DRAFT");
    expect(body.coverLetter.content).toContain("Autogenerierte Anschreiben AG");
  });

  it("verwendet die für das Unternehmen hinterlegte eigene Anschreiben-Vorlage", async () => {
    const company = await prisma.company.create({
      data: { name: "Individuelle Vorlage GmbH", letterTemplate: "Mein maßgeschneiderter Einstiegssatz für dieses Unternehmen" },
    });
    const job = await prisma.jobPosting.create({
      data: { title: "Fullstack Entwickler", description: "…", portalSource: "OTHER", companyId: company.id },
    });

    const response = await callApply(job.id);
    const body = await response.json();

    expect(body.coverLetter.content).toContain("Mein maßgeschneiderter Einstiegssatz für dieses Unternehmen");
  });
});
