import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/core/prisma";

describe("GET /api/applications/[id]/tailor", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("liefert ein TailoringResult mit Match-Score und Pitch-Argumenten", async () => {
    const company = await createTestCompany({ name: "Future Web GmbH" });
    const job = await prisma.jobPosting.create({
      data: {
        title: "Senior React Engineer",
        description: "Wir arbeiten mit React, TypeScript und Next.js.",
        techStack: "React, TypeScript, Next.js",
        portalSource: "OTHER",
        companyId: company.id,
      },
    });

    const app = await prisma.application.create({
      data: {
        position: "React Engineer",
        companyId: company.id,
        jobPostingId: job.id,
      },
    });

    const req = new NextRequest(`http://localhost/api/applications/${app.id}/tailor`);
    const res = await GET(req, { params: Promise.resolve({ id: app.id }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.overallMatchScore).toBeGreaterThan(0);
    expect(Array.isArray(body.requirements)).toBe(true);
    expect(body.tailoredOpeningPitch).toBeDefined();
    expect(body.recommendedCoverLetterParagraph).toBeDefined();
  });

  it("liefert 404 für nicht existente Bewerbungen", async () => {
    const req = new NextRequest("http://localhost/api/applications/nonexistent/tailor");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
  });
});
