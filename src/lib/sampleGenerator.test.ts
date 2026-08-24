import { describe, expect, it } from "vitest";
import { SAMPLE_COMPANIES } from "./sampleGenerator";

describe("sampleGenerator", () => {
  it("enthält gültige Beispieldaten mit allen erforderlichen Feldern", () => {
    expect(SAMPLE_COMPANIES.length).toBeGreaterThan(0);
    for (const sample of SAMPLE_COMPANIES) {
      expect(sample.name).toBeTruthy();
      expect(sample.position).toBeTruthy();
      expect(sample.portal).toBeTruthy();
      expect(["DRAFT", "SENT", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]).toContain(sample.status);
    }
  });
});
