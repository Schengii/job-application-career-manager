import { describe, it, expect } from "vitest";
import { calculateRelocationCompensation } from "@/lib/salary/currencyRelocation";

describe("currencyRelocation", () => {
  it("rechnet nominales CHF-Gehalt in EUR und Kaufkraft um", () => {
    const res = calculateRelocationCompensation({
      nominalSalaryAnnual: 110000,
      currency: "CHF",
      targetLocation: "ZUERICH_CH",
    });

    expect(res.currency).toBe("CHF");
    expect(res.salaryInEur).toBeGreaterThan(110000); // 110k / 0.96 ≈ 114583 €
    expect(res.purchasingPowerAdjustedEur).toBeLessThan(res.salaryInEur); // Zürich Lebenshaltungskostenindex 175
    expect(res.estimatedNetAnnualEur).toBeGreaterThan(80000); // ~80% Netto in CH
    expect(res.recommendation).toContain("Schweizer Steuerquote");
  });

  it("rechnet US-Remote-Gehalt in USD korrekt um", () => {
    const res = calculateRelocationCompensation({
      nominalSalaryAnnual: 85000,
      currency: "USD",
      targetLocation: "US_REMOTE",
    });

    expect(res.salaryInEur).toBe(Math.round(85000 / 1.08));
    expect(res.estimatedNetMonthlyEur).toBeGreaterThan(3000);
    expect(res.recommendation).toContain("US-Remote");
  });
});
