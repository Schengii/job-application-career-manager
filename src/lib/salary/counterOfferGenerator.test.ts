import { describe, it, expect } from "vitest";
import { generateCounterOfferStrategy } from "./counterOfferGenerator";

describe("counterOfferGenerator", () => {
  it("generates structured counter offer strategy when offer is below target", () => {
    const res = generateCounterOfferStrategy({
      offeredSalary: 48000,
      targetSalary: 54000,
      companyName: "Tech Corp",
      position: "Frontend Developer",
      contactPerson: "Dr. Weber",
      strongestSkills: ["React 19", "TypeScript"],
    });

    expect(res.differenceAmount).toBe(6000);
    expect(res.differencePercent).toBe(13);
    expect(res.isAcceptableDirectly).toBe(false);
    expect(res.recommendedCounterAmount).toBeGreaterThan(48000);
    expect(res.recommendedCounterAmount).toBeLessThanOrEqual(54000);
    expect(res.negotiationLevers.length).toBeGreaterThanOrEqual(3);
    expect(res.letterDraft).toContain("Dr. Weber");
    expect(res.letterDraft).toContain("React 19");
    expect(res.letterDraft).toContain("54.000 €");
  });

  it("handles offers matching or exceeding target salary", () => {
    const res = generateCounterOfferStrategy({
      offeredSalary: 55000,
      targetSalary: 52000,
      companyName: "Acme AG",
      position: "Web Developer",
    });

    expect(res.isAcceptableDirectly).toBe(true);
    expect(res.differenceAmount).toBeLessThanOrEqual(0);
    expect(res.recommendedCounterAmount).toBe(55000);
  });
});
