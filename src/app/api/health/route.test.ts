import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "./route";
import { resetDb } from "@/test/dbTestUtils";

describe("GET /api/health", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("liefert status 'ok' bei intakter Datenbank", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.database.connected).toBe(true);
    expect(body.timestamp).toBeDefined();
  });
});
