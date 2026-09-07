import { describe, it, expect } from "vitest";
import { calculateNoticePeriod } from "./noticePeriodCalculator";

describe("noticePeriodCalculator", () => {
  it("liefert sofortige Verfügbarkeit bei Arbeitssuchend / Umschulung beendet", () => {
    const res = calculateNoticePeriod({
      currentStatus: "UNEMPLOYED_OR_STUDENT",
      rule: "IMMEDIATE",
    });

    expect(res.isImmediatelyAvailable).toBe(true);
    expect(res.coverLetterSnippet).toContain("ab sofort bzw. kurzfristig");
  });

  it("berechnet Kündigung mit bereits feststehendem Austrittsdatum und Urlaubstagen", () => {
    const fixedExit = new Date(2026, 9, 31); // 31. Oktober 2026
    const res = calculateNoticePeriod({
      currentStatus: "NOTICE_GIVEN",
      rule: "MONTHS_END",
      noticeGivenDate: fixedExit,
      remainingVacationDays: 5,
      overtimeHours: 16, // 2 Tage bei 40h/Woche
      weeklyWorkHours: 40,
    });

    expect(res.isImmediatelyAvailable).toBe(false);
    expect(res.effectiveFreeDays).toBe(7);
    // Startdatum ist 1. November 2026
    expect(res.earliestStartDate.getDate()).toBe(1);
    expect(res.earliestStartDate.getMonth()).toBe(10); // Nov
    expect(res.coverLetterSnippet).toContain("01.11.2026");
  });

  it("berechnet Probezeitkündigung von genau 14 Tagen", () => {
    const ref = new Date(2026, 5, 1); // 1. Juni 2026
    const res = calculateNoticePeriod({
      currentStatus: "EMPLOYED",
      rule: "PROBATION_2_WEEKS",
      referenceDate: ref,
    });

    expect(res.earliestStartDate.getDate()).toBe(16); // 1. + 14 = 15. Juni Austritt -> 16. Juni Start
    expect(res.earliestStartDate.getMonth()).toBe(5); // Juni
  });
});
