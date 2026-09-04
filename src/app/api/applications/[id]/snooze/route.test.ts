import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/core/prisma";

describe("POST /api/applications/[id]/snooze", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("verschiebt nextStepDate um 7 Tage und legt einen Interaktionseintrag an", async () => {
    const company = await createTestCompany({ name: "Snooze Tech GmbH" });
    const app = await prisma.application.create({
      data: {
        position: "Frontend Developer",
        companyId: company.id,
        status: "SENT",
      },
    });

    const req = new NextRequest(`http://localhost/api/applications/${app.id}/snooze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: 7 }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: app.id }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.nextStepDate).toBeDefined();

    const updatedApp = await prisma.application.findUnique({
      where: { id: app.id },
      include: { interactions: true },
    });

    expect(updatedApp?.nextStepDate).toBeDefined();
    expect(updatedApp?.interactions.length).toBe(1);
    expect(updatedApp?.interactions[0].title).toContain("+7 Tage");
  });
});
