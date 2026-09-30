import { describe, it, expect } from "vitest";
import {
  calculateTravelCost,
  generateTaxReport,
  generateTaxCsvExport,
  type TaxDeductibleItem,
} from "./taxReportCalculator";

describe("taxReportCalculator", () => {
  it("calculates travel costs using 0.30 EUR / km", () => {
    expect(calculateTravelCost(100)).toBe(30);
    expect(calculateTravelCost(45)).toBe(13.5);
    expect(calculateTravelCost(0)).toBe(0);
  });

  it("aggregates yearly deductible expenses correctly", () => {
    const items: TaxDeductibleItem[] = [
      {
        id: "1",
        category: "TRAVEL",
        date: "2026-03-15",
        description: "Vorstellungsgespräch Köln",
        companyName: "Tech Corp",
        amount: 36,
        distanceKm: 120,
      },
      {
        id: "2",
        category: "APPLICATION_FEE",
        date: "2026-04-10",
        description: "Bewerbungsmappe postalisch",
        amount: 8.5,
      },
      {
        id: "3",
        category: "EQUIPMENT",
        date: "2026-05-02",
        description: "Professionelle Bewerbungsfotos",
        amount: 79,
      },
      {
        id: "4",
        category: "TRAVEL",
        date: "2025-11-20", // Previous year
        description: "Altes Gespräch",
        amount: 50,
      },
    ];

    const report2026 = generateTaxReport(2026, items);

    expect(report2026.year).toBe(2026);
    expect(report2026.items.length).toBe(3);
    expect(report2026.totalTravelCost).toBe(36);
    expect(report2026.totalApplicationFees).toBe(8.5);
    expect(report2026.totalOtherCost).toBe(79);
    expect(report2026.totalDeductible).toBe(123.5);
    expect(report2026.interviewTripsCount).toBe(1);
  });

  it("exports valid CSV data format", () => {
    const report = generateTaxReport(2026, [
      {
        id: "1",
        category: "TRAVEL",
        date: "2026-01-15",
        description: "Interview Fahrt",
        amount: 30,
        distanceKm: 100,
      },
    ]);

    const csv = generateTaxCsvExport(report);
    expect(csv).toContain("Datum;Kategorie;Unternehmen / Verwendungszweck;Distanz (km);Absetzbarer Betrag (EUR)");
    expect(csv).toContain("STEUERLICH ABSETZBARER GESAMTBETRAG;;;;30,00");
  });
});
