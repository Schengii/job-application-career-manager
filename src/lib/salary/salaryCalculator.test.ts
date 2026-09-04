import { describe, expect, it } from "vitest";
import { calculateOfferScore } from "@/lib/salary/salaryCalculator";

describe("calculateOfferScore", () => {
  it("berechnet monatliches Brutto, geschätztes Netto, Fahrtkostenersparnis und Score", () => {
    const calculated = calculateOfferScore({
      id: "test-1",
      companyName: "Tech Corp",
      position: "Frontend Developer",
      baseSalaryAnnual: 60000,
      homeOfficeDaysPerWeek: 4,
      vacationDays: 30,
      educationBudgetAnnual: 2000,
      annualBonus: 3000,
      publicTransportCovered: true,
    });

    expect(calculated.baseSalaryMonthly).toBe(5000);
    expect(calculated.estimatedNetMonthly).toBe(3000);
    expect(calculated.estimatedCommuteSavingsAnnual).toBeGreaterThan(0);
    expect(calculated.totalCompensationScore).toBeGreaterThan(70);
  });
});
