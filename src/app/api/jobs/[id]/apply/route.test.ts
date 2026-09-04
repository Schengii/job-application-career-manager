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
import { prisma } from "@/lib/core/prisma";

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

  it("holt bei einer bereits bestehenden, aber unvollständigen Bewerbung die fehlenden Standard-Dokumente/das Anschreiben nach (statt sie stillschweigend als fertig zurückzugeben)", async () => {
    // Simuliert genau das Szenario, das zuvor zu einer dauerhaft unvollständigen
    // Bewerbung führte: die Application wurde bereits angelegt (z.B. weil ein
    // vorheriger Aufruf nach diesem Schritt fehlgeschlagen ist), aber weder
    // Standard-Dokumente noch Anschreiben wurden je angehängt.
    const company = await createTestCompany({ name: "Nachtrag GmbH" });
    const job = await prisma.jobPosting.create({
      data: { title: "DevOps Engineer", description: "…", portalSource: "OTHER", companyId: company.id },
    });
    await prisma.document.create({
      data: { name: "Lebenslauf 2026", category: "LEBENSLAUF", isDefault: true },
    });
    await prisma.application.create({
      data: { position: job.title, status: "DRAFT", companyId: company.id, jobPostingId: job.id },
    });

    const response = await callApply(job.id);
    expect(response.status).toBe(200); // Bewerbung existierte bereits -> kein 201
    const body = await response.json();

    expect(body.documents).toHaveLength(1);
    expect(body.coverLetter).toBeTruthy();
    expect(body.coverLetter.status).toBe("DRAFT");

    // Es darf weiterhin nur genau eine Application für diese Stelle existieren.
    const allApplications = await prisma.application.findMany({ where: { jobPostingId: job.id } });
    expect(allApplications).toHaveLength(1);
  });

  it("legt bei einer bereits vollständigen Bewerbung beim erneuten Aufruf kein zweites Anschreiben und keine doppelten Dokumente an", async () => {
    const company = await createTestCompany({ name: "Idempotenz AG" });
    const job = await prisma.jobPosting.create({
      data: { title: "QA Engineer", description: "…", portalSource: "OTHER", companyId: company.id },
    });
    await prisma.document.create({
      data: { name: "Lebenslauf 2026", category: "LEBENSLAUF", isDefault: true },
    });

    const first = await callApply(job.id);
    expect(first.status).toBe(201);

    const second = await callApply(job.id);
    expect(second.status).toBe(200);
    const body = await second.json();

    expect(body.documents).toHaveLength(1);
    const coverLetters = await prisma.coverLetter.findMany({ where: { applicationId: body.id } });
    expect(coverLetters).toHaveLength(1);
  });
});
