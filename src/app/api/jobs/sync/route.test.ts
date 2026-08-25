// -----------------------------------------------------------------------------
// Integrationstest: /api/jobs/sync — insbesondere die gebündelte (statt
// pro-Item sequenzielle) Company-/Duplikat-Auflösung.
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { POST, GET } from "./route";
import { resetDb } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

describe("/api/jobs/sync", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("POST legt beim ersten Sync neue Unternehmen & Jobs ohne Duplikate an", async () => {
    const response = await POST();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.createdCount).toBeGreaterThan(0);

    // Keine zwei Jobs mit identischem Titel + Unternehmen (Duplikat-Check).
    const jobs = await prisma.jobPosting.findMany({ select: { title: true, companyId: true } });
    const keys = jobs.map((j) => `${j.companyId}::${j.title}`);
    expect(new Set(keys).size).toBe(keys.length);

    // Keine doppelt angelegten Unternehmen mit demselben Namen.
    const companies = await prisma.company.findMany({ select: { name: true } });
    const names = companies.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("POST bei wiederholtem Aufruf legt bereits vorhandene Jobs nicht doppelt an", async () => {
    await POST();
    const totalAfterFirstSync = await prisma.jobPosting.count();

    const secondResponse = await POST();
    const secondBody = await secondResponse.json();

    // generateMultiPortalBatch() erzeugt bei jedem Aufruf zufällige Titel,
    // echte 1:1-Duplikate sind daher selten garantiert – die Kerneigenschaft,
    // die dieser Test prüft, ist, dass KEIN bereits vorhandener
    // (companyId, title)-Schlüssel doppelt in der DB landet.
    const jobs = await prisma.jobPosting.findMany({ select: { title: true, companyId: true } });
    const keys = jobs.map((j) => `${j.companyId}::${j.title}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(await prisma.jobPosting.count()).toBe(totalAfterFirstSync + secondBody.createdCount);
  });

  it("GET liefert die Gesamtzahl an Jobs und unterstützte Portale", async () => {
    await POST();
    const response = await GET();
    const body = await response.json();

    expect(body.totalJobsCount).toBeGreaterThan(0);
    expect(Array.isArray(body.supportedPortals)).toBe(true);
  });
});
