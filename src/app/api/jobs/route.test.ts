// -----------------------------------------------------------------------------
// Integrationstest: /api/jobs (GET/POST)
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

function getRequest(query = "") {
  return new NextRequest(`http://localhost/api/jobs${query}`);
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/jobs", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("POST legt ein Stellenangebot an und erzeugt bei companyName automatisch das Unternehmen", async () => {
    const response = await POST(
      postRequest({
        title: "Frontend-Entwickler",
        description: "React & TypeScript gesucht",
        portalSource: "STEPSTONE",
        companyName: "Neue Firma GmbH",
      }),
    );
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.company.name).toBe("Neue Firma GmbH");

    const companyCount = await prisma.company.count();
    expect(companyCount).toBe(1);
  });

  it("GET liefert ohne Pagination ein nach Match-Score sortiertes Array", async () => {
    const company = await createTestCompany();
    await prisma.jobPosting.create({
      data: { title: "Job A", description: "d", portalSource: "OTHER", companyId: company.id },
    });
    await prisma.jobPosting.create({
      data: { title: "Job B", description: "d", portalSource: "OTHER", companyId: company.id },
    });

    const response = await GET(getRequest());
    const body = await response.json();

    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0]).toHaveProperty("matchScore");
  });

  it("GET liefert mit ?page/?pageSize eine paginierte, weiterhin nach Match-Score sortierte Antwort", async () => {
    const company = await createTestCompany();
    for (let i = 0; i < 5; i++) {
      await prisma.jobPosting.create({
        data: { title: `Job ${i}`, description: "d", portalSource: "OTHER", companyId: company.id },
      });
    }

    const response = await GET(getRequest("?page=1&pageSize=2"));
    const body = await response.json();

    expect(body.total).toBe(5);
    expect(body.data).toHaveLength(2);
  });
});
