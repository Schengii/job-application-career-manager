import { describe, expect, it } from "vitest";
import {
  calculatePrepProgress,
  DEFAULT_COMPANY_PREP_CHECKLIST,
  CompanyPrepItem,
} from "@/lib/companies/companyPrep";

describe("companyPrep", () => {
  it("berechnet Fortschritt der Vorbereitungs-Checkliste korrekt", () => {
    const initial = calculatePrepProgress(DEFAULT_COMPANY_PREP_CHECKLIST);
    expect(initial.total).toBe(5);
    expect(initial.completed).toBe(0);
    expect(initial.progressPct).toBe(0);

    const partiallyCompleted: CompanyPrepItem[] = DEFAULT_COMPANY_PREP_CHECKLIST.map((item, idx) => ({
      ...item,
      completed: idx < 2, // 2 von 5
    }));

    const progress = calculatePrepProgress(partiallyCompleted);
    expect(progress.completed).toBe(2);
    expect(progress.progressPct).toBe(40);
  });

  it("gibt 100% zurück bei leerer Checkliste", () => {
    const res = calculatePrepProgress([]);
    expect(res.progressPct).toBe(100);
  });
});
