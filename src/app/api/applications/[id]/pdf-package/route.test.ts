import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

describe("GET /api/applications/[id]/pdf-package", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("liefert ein zusammengeführtes PDF-Dokument für eine bestehende Bewerbung", async () => {
    const company = await createTestCompany({ name: "Acme Tech" });
    const app = await prisma.application.create({
      data: {
        position: "Frontend Entwickler",
        companyId: company.id,
        coverLetter: {
          create: {
            content: "Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich als Frontend Entwickler.",
          },
        },
      },
    });

    const req = new NextRequest(`http://localhost/api/applications/${app.id}/pdf-package?includeCoverSheet=true`);
    const res = await GET(req, { params: Promise.resolve({ id: app.id }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("Bewerbungsmappe_Acme_Tech_Frontend_Entwickler.pdf");

    const blob = await res.blob();
    expect(blob.size).toBeGreaterThan(500);
  });

  it("liefert 404 bei ungültiger Bewerbungs-ID", async () => {
    const req = new NextRequest("http://localhost/api/applications/invalid-id/pdf-package");
    const res = await GET(req, { params: Promise.resolve({ id: "invalid-id" }) });
    expect(res.status).toBe(404);
  });
});
