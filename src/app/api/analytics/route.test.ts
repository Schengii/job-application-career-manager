// -----------------------------------------------------------------------------
// Integrationstest: /api/analytics — insbesondere die neuen Tag-/Tech-Stack-
// Erfolgsquoten (src/lib/skillSuccessRates.ts).
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/core/prisma";

describe("/api/analytics", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("liefert leere Erfolgsquoten-Listen für eine leere Datenbank", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.totalApplications).toBe(0);
    expect(body.tagSuccessRates).toEqual([]);
    expect(body.techStackSuccessRates).toEqual([]);
  });

  it("berechnet die Tech-Stack-Erfolgsquote anhand der verknüpften Stellenanzeige", async () => {
    const company = await createTestCompany();
    const jobPosting = await prisma.jobPosting.create({
      data: { title: "Job", description: "d", portalSource: "OTHER", companyId: company.id, techStack: "React,TypeScript" },
    });

    await prisma.application.create({
      data: { position: "A", status: "OFFER", companyId: company.id, jobPostingId: jobPosting.id },
    });
    await prisma.application.create({
      data: { position: "B", status: "REJECTED", companyId: company.id, jobPostingId: jobPosting.id, tags: "Remote" },
    });

    const response = await GET();
    const body = await response.json();

    const react = body.techStackSuccessRates.find((r: { skill: string }) => r.skill === "React");
    expect(react).toBeDefined();
    expect(react.total).toBe(2);
    expect(react.offerCount).toBe(1);

    // Nur 1 Bewerbung mit dem Tag "Remote" -> unter der Mindeststichprobe, wird also ausgefiltert.
    expect(body.tagSuccessRates.find((r: { skill: string }) => r.skill === "Remote")).toBeUndefined();
  });
});
