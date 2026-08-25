// -----------------------------------------------------------------------------
// Integrationstest: Job Dismissal, Blacklist & Restoration
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as dismissPost } from "./[id]/dismiss/route";
import { POST as restorePost } from "./[id]/restore/route";
import { GET as jobsGet } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

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

describe("Job Dismissal & Blacklist API", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("blendet einen Job aus und speichert den Grund", async () => {
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

    // Prüfen, ob negative Kriterien in den Präferenzen gelernt wurden
    const pref = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(pref?.excludedKeywords).toContain("schicht");
    expect(pref?.excludedTechStack).toContain("java");
  });

  it("setzt bei Firmen-Blacklist die Firma in die Präferenzen und blendet alle Firmenjobs aus", async () => {
    const company = await createTestCompany({ name: "Schlechte Firma GmbH" });
    const job1 = await prisma.jobPosting.create({
      data: { title: "Job 1", description: "desc", portalSource: "STEPSTONE", companyId: company.id },
    });
    const job2 = await prisma.jobPosting.create({
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

    // Beide Jobs des Unternehmens müssen jetzt als ausgeblendet markiert sein
    const updatedJobs = await prisma.jobPosting.findMany({ where: { companyId: company.id } });
    expect(updatedJobs.every((j) => j.isDismissed)).toBe(true);
  });

  it("filtert ausgeblendete Jobs im normalen GET /api/jobs heraus und zeigt sie bei ?dismissedOnly=true", async () => {
    const company = await createTestCompany();
    await prisma.jobPosting.create({
      data: { title: "Aktiver Job", description: "desc", portalSource: "STEPSTONE", companyId: company.id, isDismissed: false },
    });
    await prisma.jobPosting.create({
      data: { title: "Ausgeblendeter Job", description: "desc", portalSource: "STEPSTONE", companyId: company.id, isDismissed: true },
    });

    // Standard GET: nur aktive Jobs
    const activeRes = await jobsGet(new NextRequest("http://localhost/api/jobs"));
    const activeData = await activeRes.json();
    expect(activeData).toHaveLength(1);
    expect(activeData[0].title).toBe("Aktiver Job");

    // Dismissed Only GET
    const dismissedRes = await jobsGet(new NextRequest("http://localhost/api/jobs?dismissedOnly=true"));
    const dismissedData = await dismissedRes.json();
    expect(dismissedData).toHaveLength(1);
    expect(dismissedData[0].title).toBe("Ausgeblendeter Job");
  });

  it("stellt einen ausgeblendeten Job wieder her (POST /restore)", async () => {
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
