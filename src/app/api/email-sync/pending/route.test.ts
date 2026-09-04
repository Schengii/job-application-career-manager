// -----------------------------------------------------------------------------
// Integrationstest: /api/email-sync/pending (GET/POST)
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/core/prisma";
import { GET, POST } from "./route";

const mockSendDueNotifications = vi.fn().mockResolvedValue({ sent: 0, skipped: 0 });
vi.mock("@/lib/settings/pushNotifications", () => ({
  sendDueNotifications: () => mockSendDueNotifications(),
}));

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/email-sync/pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

let suggestionCounter = 0;

async function createSuggestion(applicationId: string, overrides: Partial<{ suggestedStatus: string | null; status: string; emailId: string }> = {}) {
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
      applicationId,
    },
  });
}

describe("/api/email-sync/pending", () => {
  beforeEach(async () => {
    await resetDb();
    mockSendDueNotifications.mockClear();
  });

  it("GET liefert nur PENDING-Vorschläge, inkl. Bewerbung/Unternehmen", async () => {
    const company = await createTestCompany({ name: "adesso SE" });
    const app = await prisma.application.create({ data: { position: "Frontend Entwickler", status: "SENT", companyId: company.id } });
    await createSuggestion(app.id);
    await createSuggestion(app.id, { status: "ACCEPTED" });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].status).toBe("PENDING");
    expect(body[0].application.company.name).toBe("adesso SE");
  });

  it("POST mit action=ACCEPT übernimmt den vorgeschlagenen Status und markiert den Vorschlag als ACCEPTED", async () => {
    const company = await createTestCompany();
    const app = await prisma.application.create({ data: { position: "X", status: "SENT", companyId: company.id } });
    const suggestion = await createSuggestion(app.id, { suggestedStatus: "INTERVIEW" });

    const response = await POST(postRequest({ suggestionId: suggestion.id, action: "ACCEPT" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.suggestion.status).toBe("ACCEPTED");

    const updatedApp = await prisma.application.findUnique({ where: { id: app.id }, include: { statusEvents: true } });
    expect(updatedApp?.status).toBe("INTERVIEW");
    expect(updatedApp?.statusEvents).toHaveLength(1);
    expect(mockSendDueNotifications).toHaveBeenCalledOnce();
  });

  it("POST mit action=REJECT ändert die Bewerbung NICHT, markiert den Vorschlag aber als REJECTED", async () => {
    const company = await createTestCompany();
    const app = await prisma.application.create({ data: { position: "X", status: "SENT", companyId: company.id } });
    const suggestion = await createSuggestion(app.id);

    const response = await POST(postRequest({ suggestionId: suggestion.id, action: "REJECT" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.suggestion.status).toBe("REJECTED");

    const updatedApp = await prisma.application.findUnique({ where: { id: app.id } });
    expect(updatedApp?.status).toBe("SENT");
    expect(mockSendDueNotifications).not.toHaveBeenCalled();
  });

  it("POST für einen bereits bearbeiteten Vorschlag liefert einen 4xx-Fehler", async () => {
    const company = await createTestCompany();
    const app = await prisma.application.create({ data: { position: "X", status: "SENT", companyId: company.id } });
    const suggestion = await createSuggestion(app.id, { status: "ACCEPTED" });

    const response = await POST(postRequest({ suggestionId: suggestion.id, action: "REJECT" }));
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it("POST für eine unbekannte suggestionId liefert 404", async () => {
    const response = await POST(postRequest({ suggestionId: "does-not-exist", action: "REJECT" }));
    expect(response.status).toBe(404);
  });
});
