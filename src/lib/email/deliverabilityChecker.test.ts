import { describe, it, expect } from "vitest";
import { checkEmailDeliverability } from "./deliverabilityChecker";

describe("deliverabilityChecker", () => {
  it("evaluates custom domain positively", () => {
    const res = checkEmailDeliverability("dev@maximilian-schmidt.dev");
    expect(res.isCustomDomain).toBe(true);
    expect(res.domain).toBe("maximilian-schmidt.dev");
    expect(res.score).toBeGreaterThanOrEqual(85);
    expect(res.status).toBe("OPTIMAL");
  });

  it("identifies freemail providers and gives recommendation", () => {
    const res = checkEmailDeliverability("max.mustermann@gmail.com");
    expect(res.isCustomDomain).toBe(false);
    expect(res.domain).toBe("gmail.com");
    expect(res.score).toBe(70);
    expect(res.status).toBe("GOOD");
    expect(res.recommendations.length).toBeGreaterThan(0);
  });

  it("penalizes suspicious numbers in local part", () => {
    const res = checkEmailDeliverability("bewerbung12345@web.de");
    expect(res.score).toBeLessThan(70);
    expect(res.recommendations.some((r) => r.includes("Zahlenfolgen"))).toBe(true);
  });

  it("handles invalid email addresses gracefully", () => {
    const res = checkEmailDeliverability("invalid-email");
    expect(res.status).toBe("CRITICAL");
    expect(res.score).toBe(20);
  });
});
