// -----------------------------------------------------------------------------
// Integrationstest: GET /api/applications/:id/package/pdf
// -----------------------------------------------------------------------------
// Die eigentliche Merge-Logik (PDF-Seiten übernehmen, Bilder einbetten, defekte
// Dateien überspringen) ist bereits ausführlich in src/lib/pdfMerge.test.ts
// abgedeckt — hier wird nur der HTTP-Vertrag der Route geprüft.
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

function getRequest(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/applications/:id/package/pdf", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("liefert 404 für eine unbekannte Bewerbung", async () => {
    const response = await GET(new NextRequest("http://localhost/x"), getRequest("does-not-exist"));
    expect(response.status).toBe(404);
  });

  it("liefert ein PDF mit korrekten Headern und Dateinamen aus Firma & Position", async () => {
    const company = await createTestCompany({ name: "Acme GmbH" });
    const application = await prisma.application.create({
      data: {
        position: "Frontend Entwickler",
        companyId: company.id,
        coverLetter: { create: { content: "Sehr geehrte Damen und Herren,\n\nTestinhalt.", status: "DRAFT" } },
      },
    });

    const response = await GET(new NextRequest("http://localhost/x"), getRequest(application.id));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("Bewerbung_Acme_GmbH_Frontend_Entwickler.pdf");

    const buffer = Buffer.from(await response.arrayBuffer());
    // PDF-Dateien beginnen immer mit der Magic Number "%PDF-".
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("funktioniert auch ohne Anschreiben und ohne angehängte Dokumente", async () => {
    const company = await createTestCompany();
    const application = await prisma.application.create({
      data: { position: "Backend Entwickler", companyId: company.id },
    });

    const response = await GET(new NextRequest("http://localhost/x"), getRequest(application.id));
    expect(response.status).toBe(200);
  });
});
