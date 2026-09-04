// -----------------------------------------------------------------------------
// Integrationstest: POST /api/applications/:id/status
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/core/prisma";

// sendDueNotifications() wird fire-and-forget aufgerufen (siehe route.ts) —
// hier gemockt, damit der Test weder auf echten Web-Push-Versand wartet noch
// durch dessen (asynchrone, nicht awaited) DB-Zugriffe mit `resetDb()` im
// nächsten Test kollidieren kann.
const mockSendDueNotifications = vi.fn().mockResolvedValue({ sent: 0, skipped: 0 });
vi.mock("@/lib/settings/pushNotifications", () => ({
  sendDueNotifications: () => mockSendDueNotifications(),
}));

import { POST } from "./route";

function statusRequest(body: unknown) {
  return new NextRequest("http://localhost/api/applications/1/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/applications/:id/status", () => {
  beforeEach(async () => {
    await resetDb();
    mockSendDueNotifications.mockClear();
  });

  it("aktualisiert Status + legt einen Status-Event-Eintrag an", async () => {
    const company = await createTestCompany();
    const app = await prisma.application.create({ data: { position: "X", status: "DRAFT", companyId: company.id } });

    const response = await POST(statusRequest({ status: "SENT" }), { params: Promise.resolve({ id: app.id }) });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("SENT");
    expect(body.statusEvents[0].status).toBe("SENT");
  });

  it("löst nach einer erfolgreichen Statusänderung sendDueNotifications() aus (Web-Push)", async () => {
    const company = await createTestCompany();
    const app = await prisma.application.create({ data: { position: "X", status: "SENT", companyId: company.id } });

    await POST(statusRequest({ status: "OFFER" }), { params: Promise.resolve({ id: app.id }) });

    expect(mockSendDueNotifications).toHaveBeenCalledOnce();
  });

  it("gibt bei unbekannter ID einen 4xx-Fehler statt eines rohen 500ers zurück", async () => {
    const response = await POST(statusRequest({ status: "SENT" }), { params: Promise.resolve({ id: "does-not-exist" }) });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });
});
