// -----------------------------------------------------------------------------
// Integrationstest: /api/applications (GET/POST) gegen die echte SQLite-
// Testdatenbank (siehe vitest.global-setup.ts).
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

function getRequest(query = "") {
  return new NextRequest(`http://localhost/api/applications${query}`);
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/applications", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("POST legt eine neue Bewerbung an, inkl. initialem Status-Event", async () => {
    const company = await createTestCompany();

    const response = await POST(postRequest({ position: "Frontend-Entwickler", companyId: company.id }));
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.position).toBe("Frontend-Entwickler");
    expect(body.status).toBe("DRAFT");
    expect(body.statusEvents).toHaveLength(1);
    expect(body.statusEvents[0].note).toBe("Bewerbung angelegt");
  });

  it("POST lehnt eine Bewerbung ohne companyId mit 400 ab", async () => {
    const response = await POST(postRequest({ position: "Frontend-Entwickler" }));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Validierungsfehler");
  });

  it("POST lehnt eine unbekannte companyId als Fremdschlüsselfehler ab (kein 500 mit Stacktrace-Leak)", async () => {
    const response = await POST(postRequest({ position: "Frontend-Entwickler", companyId: "does-not-exist" }));
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it("GET filtert nach Status, wenn ?status= gesetzt ist", async () => {
    const company = await createTestCompany();
    await prisma.application.create({ data: { position: "A", status: "SENT", companyId: company.id } });
    await prisma.application.create({ data: { position: "B", status: "INTERVIEW", companyId: company.id } });

    const response = await GET(getRequest("?status=INTERVIEW"));
    const body = await response.json();

    expect(body).toHaveLength(1);
    expect(body[0].position).toBe("B");
  });

  it("GET liefert ohne Filter alle Bewerbungen inkl. Company-Relation", async () => {
    const company = await createTestCompany({ name: "Beispiel AG" });
    await prisma.application.create({ data: { position: "A", companyId: company.id } });

    const response = await GET(getRequest());
    const body = await response.json();

    expect(body).toHaveLength(1);
    expect(body[0].company.name).toBe("Beispiel AG");
  });

  it("GET liefert ohne ?page/?pageSize weiterhin ein einfaches Array (Rückwärtskompatibilität)", async () => {
    const company = await createTestCompany();
    for (let i = 0; i < 3; i++) {
      await prisma.application.create({ data: { position: `Position ${i}`, companyId: company.id } });
    }

    const response = await GET(getRequest());
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(3);
  });

  it("GET liefert mit ?page/?pageSize eine paginierte Antwort", async () => {
    const company = await createTestCompany();
    for (let i = 0; i < 5; i++) {
      await prisma.application.create({ data: { position: `Position ${i}`, companyId: company.id } });
    }

    const response = await GET(getRequest("?page=2&pageSize=2"));
    const body = await response.json();

    expect(body.total).toBe(5);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(2);
    expect(body.totalPages).toBe(3);
    expect(body.data).toHaveLength(2);
  });
});
