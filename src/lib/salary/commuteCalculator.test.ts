import { describe, it, expect } from "vitest";
import { calculateCommuteAndRemoteNet } from "./commuteCalculator";

describe("commuteCalculator", () => {
  it("calculates 100% remote with zero commute cost and maximum effective wage", () => {
    const result = calculateCommuteAndRemoteNet({
      grossSalaryAnnual: 48000,
      officeDaysPerWeek: 0,
      distanceKmOneWay: 35,
      travelTimeMinutesOneWay: 45,
      transitMode: "TRANSIT_DEUTSCHLANDTICKET",
    });

    expect(result.monthlyGross).toBe(4000);
    expect(result.estimatedMonthlyNet).toBe(2400);
    expect(result.monthlyCommuteCostEur).toBe(0);
    expect(result.monthlyCommuteHours).toBe(0);
    expect(result.netAfterCommuteEur).toBe(2400);
    expect(result.effectiveHourlyWageNet).toBe(result.nominalHourlyWageNet);
    expect(result.recommendation).toContain("100% Remote");
  });

  it("calculates car commuting correctly and reflects fuel and wear-and-tear", () => {
    const result = calculateCommuteAndRemoteNet({
      grossSalaryAnnual: 54000,
      officeDaysPerWeek: 3,
      distanceKmOneWay: 30, // 60km roundtrip
      travelTimeMinutesOneWay: 40, // 80 min daily
      transitMode: "CAR",
      carFuelConsumptionLitersPer100Km: 7.0,
      fuelPricePerLiter: 1.8,
      carWearAndTearPerKm: 0.15,
      employerTransitSubsidyMonthlyEur: 50,
    });

    expect(result.monthlyCommuteCostEur).toBeGreaterThan(120);
    expect(result.monthlyCommuteHours).toBeGreaterThan(10);
    expect(result.netAfterCommuteEur).toBeLessThan(result.estimatedMonthlyNet);
    expect(result.effectiveHourlyWageNet).toBeLessThan(result.nominalHourlyWageNet);
  });

  it("calculates Deutschlandticket with fixed price and employer subsidy", () => {
    const result = calculateCommuteAndRemoteNet({
      grossSalaryAnnual: 45000,
      officeDaysPerWeek: 2,
      distanceKmOneWay: 25,
      travelTimeMinutesOneWay: 35,
      transitMode: "TRANSIT_DEUTSCHLANDTICKET",
      transitMonthlyPassEur: 58,
      employerTransitSubsidyMonthlyEur: 25,
    });

    expect(result.monthlyCommuteCostEur).toBe(33); // 58 - 25
    expect(result.commuteCostBreakdown.wearAndTearMonthly).toBe(0);
  });
});
