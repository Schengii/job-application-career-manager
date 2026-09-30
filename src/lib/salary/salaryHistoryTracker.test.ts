import { describe, it, expect } from "vitest";
import { extractSalaryAmount, aggregateSalaryTrends } from "./salaryHistoryTracker";

describe("salaryHistoryTracker", () => {
  it("extracts salary correctly from various formats", () => {
    expect(extractSalaryAmount("55.000 € / Jahr")).toBe(55000);
    expect(extractSalaryAmount("ca. 48k Euro")).toBe(48000);
    expect(extractSalaryAmount("Gehalt: 62000 EUR")).toBe(62000);
    expect(extractSalaryAmount("Keine Angabe")).toBeNull();
  });

  it("aggregates trends across months", () => {
    const now = new Date();
    const apps = [
      {
        createdAt: now,
        jobPosting: { salaryInfo: "52.000 €" },
      },
      {
        createdAt: now,
        notes: "Angebot über 56.000 € erhalten",
      },
    ];

    const trends = aggregateSalaryTrends(apps);
    const currentMonth = trends[trends.length - 1];

    expect(currentMonth.count).toBe(2);
    expect(currentMonth.averageSalary).toBe(54000);
    expect(currentMonth.minSalary).toBe(52000);
    expect(currentMonth.maxSalary).toBe(56000);
  });
});
