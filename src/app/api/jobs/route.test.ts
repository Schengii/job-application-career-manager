// -----------------------------------------------------------------------------
// Integrationstest: /api/jobs (GET/POST)
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { POST as dismissPost } from "./[id]/dismiss/route";
import { POST as restorePost } from "./[id]/restore/route";
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

function requestParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function dismissRequest(body: unknown) {
  return new NextRequest("http://localhost/api/jobs/test/dismiss", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function restoreRequest() {
  return new NextRequest("http://localhost/api/jobs/test/restore", {
    method: "POST",
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

  it("POST speichert Ansprechpartner und Recruiter-E-Mail auf dem verknüpften Unternehmen", async () => {
    const response = await POST(
      postRequest({
        title: "Senior React Engineer",
        description: "TypeScript & Next.js",
        portalSource: "LINKEDIN",
        companyName: "Tech Recruiters Inc",
        contactName: "Frau Müller",
        contactEmail: "recruiting@techrecruiters.com",
      }),
    );
    expect(response.status).toBe(201);

    const company = await prisma.company.findFirst({ where: { name: "Tech Recruiters Inc" } });
    expect(company?.contactName).toBe("Frau Müller");
    expect(company?.contactEmail).toBe("recruiting@techrecruiters.com");
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

  it("POST /dismiss blendet einen Job aus und lernt negative Präferenzen", async () => {
    const company = await createTestCompany({ name: "ACME Corp" });
    const job = await prisma.jobPosting.create({
      data: {
        title: "Senior Java Developer",
        description: "Java, Spring Boot, Schicht",
        portalSource: "STEPSTONE",
        companyId: company.id,
      },
    });

    const response = await dismissPost(
      dismissRequest({
        reason: "TECH_MISMATCH",
        blacklistCompany: false,
        excludeKeywords: ["schicht"],
        excludeTech: ["java"],
      }),
      requestParams(job.id)
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.job.isDismissed).toBe(true);
    expect(body.job.dismissReason).toBe("TECH_MISMATCH");

    const pref = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(pref?.excludedKeywords).toContain("schicht");
    expect(pref?.excludedTechStack).toContain("java");
  });

  it("POST /dismiss mit Firmen-Blacklist blendet alle Firmenjobs aus", async () => {
    const company = await createTestCompany({ name: "Schlechte Firma GmbH" });
    const job1 = await prisma.jobPosting.create({
      data: { title: "Job 1", description: "desc", portalSource: "STEPSTONE", companyId: company.id },
    });
    await prisma.jobPosting.create({
      data: { title: "Job 2", description: "desc", portalSource: "STEPSTONE", companyId: company.id },
    });

    const response = await dismissPost(
      dismissRequest({
        reason: "UNWANTED_COMPANY",
        blacklistCompany: true,
      }),
      requestParams(job1.id)
    );

    expect(response.status).toBe(200);

    const pref = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(pref?.excludedCompanies).toContain("Schlechte Firma GmbH");

    const updatedJobs = await prisma.jobPosting.findMany({ where: { companyId: company.id } });
    expect(updatedJobs.every((j) => j.isDismissed)).toBe(true);
  });

  it("GET filtert ausgeblendete Jobs heraus und zeigt sie mit ?dismissedOnly=true", async () => {
    const company = await createTestCompany();
    await prisma.jobPosting.create({
      data: { title: "Aktiver Job", description: "desc", portalSource: "STEPSTONE", companyId: company.id, isDismissed: false },
    });
    await prisma.jobPosting.create({
      data: { title: "Ausgeblendeter Job", description: "desc", portalSource: "STEPSTONE", companyId: company.id, isDismissed: true },
    });

    const activeRes = await GET(getRequest());
    const activeData = await activeRes.json();
    expect(activeData).toHaveLength(1);
    expect(activeData[0].title).toBe("Aktiver Job");

    const dismissedRes = await GET(getRequest("?dismissedOnly=true"));
    const dismissedData = await dismissedRes.json();
    expect(dismissedData).toHaveLength(1);
    expect(dismissedData[0].title).toBe("Ausgeblendeter Job");
  });

  it("POST /restore stellt einen ausgeblendeten Job wieder her", async () => {
    const company = await createTestCompany();
    const job = await prisma.jobPosting.create({
      data: {
        title: "Test Job",
        description: "desc",
        portalSource: "STEPSTONE",
        companyId: company.id,
        isDismissed: true,
        dismissReason: "OTHER",
      },
    });

    const response = await restorePost(restoreRequest(), requestParams(job.id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.job.isDismissed).toBe(false);
    expect(body.job.dismissReason).toBeNull();
  });
});
