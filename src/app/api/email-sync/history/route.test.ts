// -----------------------------------------------------------------------------
// Integrationstest: /api/email-sync/history (GET)
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/core/prisma";
import { GET } from "./route";

function getRequest(query = "") {
  return new NextRequest(`http://localhost/api/email-sync/history${query}`);
}

let suggestionCounter = 0;

async function createSuggestion(
  applicationId: string,
  overrides: Partial<{ suggestedStatus: string | null; status: string; emailId: string; resolvedAt: Date }> = {}
) {
  suggestionCounter += 1;
  return prisma.emailSuggestion.create({
    data: {
      emailId: overrides.emailId ?? `msg-${suggestionCounter}`,
      emailFrom: "recruiting@firma.de",
      emailSubject: "Einladung zum Vorstellungsgespräch",
      emailSnippet: "Wir laden Sie ein ...",
      emailDate: new Date(),
      detectedStatus: "INTERVIEW",
      suggestedStatus: overrides.suggestedStatus ?? "INTERVIEW",
      statusLabel: "Einladung zum Vorstellungsgespräch",
      reasoning: "E-Mail enthält eine Einladung.",
      confidence: 85,
      status: overrides.status ?? "PENDING",
      resolvedAt: overrides.resolvedAt,
      applicationId,
    },
  });
}

describe("/api/email-sync/history", () => {
  beforeEach(async () => {
    await resetDb();
    suggestionCounter = 0;
  });

  it("GET liefert nur ACCEPTED/REJECTED-Vorschläge, inkl. Bewerbung/Unternehmen, neueste zuerst", async () => {
    const company = await createTestCompany({ name: "adesso SE" });
    const app = await prisma.application.create({ data: { position: "Frontend Entwickler", status: "SENT", companyId: company.id } });
    await createSuggestion(app.id, { status: "PENDING" });
    await createSuggestion(app.id, {
      status: "ACCEPTED",
      resolvedAt: new Date("2026-08-01T10:00:00Z"),
    });
    await createSuggestion(app.id, {
      status: "REJECTED",
      resolvedAt: new Date("2026-08-15T10:00:00Z"),
    });

    const response = await GET(getRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body.map((s: { status: string }) => s.status)).toEqual(["REJECTED", "ACCEPTED"]);
    expect(body[0].application.company.name).toBe("adesso SE");
  });

  it("GET respektiert den ?limit=-Parameter", async () => {
    const company = await createTestCompany();
    const app = await prisma.application.create({ data: { position: "X", status: "SENT", companyId: company.id } });
    for (let i = 0; i < 5; i += 1) {
      await createSuggestion(app.id, { status: "ACCEPTED", resolvedAt: new Date(2026, 7, i + 1) });
    }

    const response = await GET(getRequest("?limit=2"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
  });

  it("GET liefert eine leere Liste, wenn keine bearbeiteten Vorschläge existieren", async () => {
    const company = await createTestCompany();
    const app = await prisma.application.create({ data: { position: "X", status: "SENT", companyId: company.id } });
    await createSuggestion(app.id, { status: "PENDING" });

    const response = await GET(getRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});
