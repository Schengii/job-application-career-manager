// -----------------------------------------------------------------------------
// Integrationstest: /api/companies (GET/POST) gegen die echte SQLite-
// Testdatenbank (siehe vitest.global-setup.ts). Anders als die reinen
// Unit-Tests unter src/lib/*.test.ts prüft dieser Test den kompletten Pfad
// Request -> Zod-Validierung -> Prisma -> JSON-Response inkl. Fehlerfälle.
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { resetDb } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(query = "") {
  return new NextRequest(`http://localhost/api/companies${query}`);
}

describe("/api/companies", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("POST legt ein neues Unternehmen an und gibt es mit Status 201 zurück", async () => {
    const response = await POST(postRequest({ name: "Acme GmbH", city: "Bonn" }));
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.name).toBe("Acme GmbH");
    expect(body.city).toBe("Bonn");
    expect(body.status).toBe("LEAD"); // Default aus dem Prisma-Schema

    const stored = await prisma.company.findUnique({ where: { id: body.id } });
    expect(stored?.name).toBe("Acme GmbH");
  });

  it("POST lehnt einen fehlenden Pflichtnamen mit 400 + Validierungsdetails ab", async () => {
    const response = await POST(postRequest({ city: "Bonn" }));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Validierungsfehler");
    expect(body.details).toBeDefined();

    expect(await prisma.company.count()).toBe(0);
  });

  it("POST lehnt eine ungültige contactEmail ab", async () => {
    const response = await POST(postRequest({ name: "Acme GmbH", contactEmail: "keine-email" }));
    expect(response.status).toBe(400);
  });

  it("GET liefert alle Unternehmen inkl. Bewerbungs-/Job-Zähler, neueste zuerst", async () => {
    await prisma.company.create({ data: { name: "Älteres Unternehmen" } });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await prisma.company.create({ data: { name: "Neueres Unternehmen" } });

    const response = await GET(getRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe("Neueres Unternehmen");
    expect(body[0]._count).toEqual({ applications: 0, jobPostings: 0 });
  });

  it("GET liefert mit ?page/?pageSize eine paginierte Antwort", async () => {
    for (let i = 0; i < 5; i++) {
      await prisma.company.create({ data: { name: `Firma ${i}` } });
    }

    const response = await GET(getRequest("?page=1&pageSize=2"));
    const body = await response.json();

    expect(body.total).toBe(5);
    expect(body.totalPages).toBe(3);
    expect(body.data).toHaveLength(2);
  });
});
