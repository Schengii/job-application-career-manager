import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/push/vapid-public-key", () => {
  it("liefert einen nicht-leeren Public Key", async () => {
    const response = await GET();
    const body = await response.json();

    expect(typeof body.publicKey).toBe("string");
    expect(body.publicKey.length).toBeGreaterThan(0);
  });

  it("liefert bei wiederholtem Aufruf denselben Public Key (stabiles, persistiertes Schlüsselpaar)", async () => {
    const first = await (await GET()).json();
    const second = await (await GET()).json();
    expect(first.publicKey).toBe(second.publicKey);
  });
});
