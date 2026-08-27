// -----------------------------------------------------------------------------
// Integrationstest: GET /api/applications/status-counts
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

function getRequest(query = "") {
  return new NextRequest(`http://localhost/api/applications/status-counts${query}`);
}

describe("GET /api/applications/status-counts", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("liefert 0 für jeden Status, wenn keine Bewerbungen existieren", async () => {
    const response = await GET(getRequest());
    const body = await response.json();

    expect(body.total).toBe(0);
    expect(body.byStatus).toEqual({
      DRAFT: 0,
      SENT: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    });
  });

  it("zählt über ALLE Bewerbungen, nicht nur eine geladene Seite", async () => {
    const company = await createTestCompany();
    // Mehr als eine typische Seitengröße (50), damit ein rein clientseitiges
    // Zählen der geladenen Seite hier garantiert falsch läge.
    for (let i = 0; i < 60; i++) {
      await prisma.application.create({
        data: { position: `Position ${i}`, status: "SENT", companyId: company.id },
      });
    }
    await prisma.application.create({ data: { position: "Angebot", status: "OFFER", companyId: company.id } });

    const response = await GET(getRequest());
    const body = await response.json();

    expect(body.total).toBe(61);
    expect(body.byStatus.SENT).toBe(60);
    expect(body.byStatus.OFFER).toBe(1);
    expect(body.byStatus.DRAFT).toBe(0);
  });

  it("berücksichtigt Portal-/Such-/Follow-up-Filter, ignoriert aber einen mitgeschickten status-Parameter (Facet-Counts)", async () => {
    const company = await createTestCompany();
    await prisma.application.create({
      data: { position: "Frontend", status: "SENT", source: "LinkedIn", companyId: company.id },
    });
    await prisma.application.create({
      data: { position: "Backend", status: "INTERVIEW", source: "LinkedIn", companyId: company.id },
    });
    await prisma.application.create({
      data: { position: "DevOps", status: "SENT", source: "StepStone", companyId: company.id },
    });

    // Auch mit ?status=SENT muss INTERVIEW weiterhin mitgezählt werden —
    // sonst würde die Auswahl eines Status alle anderen Optionen auf 0 setzen.
    const response = await GET(getRequest("?portal=LinkedIn&status=SENT"));
    const body = await response.json();

    expect(body.total).toBe(2);
    expect(body.byStatus.SENT).toBe(1);
    expect(body.byStatus.INTERVIEW).toBe(1);
  });
});
