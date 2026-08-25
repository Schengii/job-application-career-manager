import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST, DELETE } from "./route";
import { resetDb } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";

describe("GET / POST / DELETE /api/portfolio/token", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("generiert einen sicheren Portfolio-Share-Token und speichert ihn in den Preferences", async () => {
    const postRes = await POST();
    expect(postRes.status).toBe(200);

    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.token).toBeDefined();
    expect(postData.token.length).toBeGreaterThanOrEqual(16);

    const getRes = await GET();
    const getData = await getRes.json();
    expect(getData.token).toBe(postData.token);
    expect(getData.active).toBe(true);
  });

  it("deaktiviert den Portfolio-Link per DELETE Request", async () => {
    await POST();
    const deleteRes = await DELETE();
    expect(deleteRes.status).toBe(200);

    const deleteData = await deleteRes.json();
    expect(deleteData.success).toBe(true);
    expect(deleteData.active).toBe(false);

    const pref = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(pref?.portfolioActive).toBe(false);
  });
});
