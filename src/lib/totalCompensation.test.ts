import { describe, it, expect } from "vitest";
import { calculateTotalCompensation, generateNegotiationEmailScript } from "./totalCompensation";

describe("totalCompensation", () => {
  it("berechnet Total Compensation inklusive Benefits und realem Stundenlohn", () => {
    const offer = {
      id: "off-1",
      companyName: "adesso SE",
      role: "Frontend Developer",
      baseSalaryYear: 48000,
      monthsPerYear: 12,
      bonusYear: 2000,
      bavEmployerShareMonth: 50,
      transitPassYear: 588,
      homeOfficeAllowanceYear: 600,
      learningBudgetYear: 1000,
      hardwareBudgetYear: 500,
      weeklyHours: 40,
      vacationDays: 30,
      homeOfficeDaysPerWeek: 3,
      commuteTimeMinutesOneWay: 30,
    };

    const result = calculateTotalCompensation(offer);

    expect(result.totalDirectCashYear).toBe(50000); // 48.000 + 2.000
    expect(result.totalCompensationYear).toBeGreaterThan(50000);
    expect(result.effectiveHourlyRate).toBeGreaterThan(20);
    expect(result.negotiationLevers.length).toBeGreaterThan(0);
  });

  it("erzeugt ein formelles, stichhaltiges Verhandlungs-E-Mail-Skript", () => {
    const offer = {
      id: "off-1",
      companyName: "REWE digital",
      role: "React Entwickler",
      baseSalaryYear: 46000,
      monthsPerYear: 12,
      weeklyHours: 38.5,
      vacationDays: 28,
      homeOfficeDaysPerWeek: 2,
      commuteTimeMinutesOneWay: 25,
    };

    const result = calculateTotalCompensation(offer);
    const script = generateNegotiationEmailScript(result, 50000, "Alexander Schepp");

    expect(script).toContain("REWE digital");
    expect(script).toContain("50.000 €");
    expect(script).toContain("Alexander Schepp");
  });
});
