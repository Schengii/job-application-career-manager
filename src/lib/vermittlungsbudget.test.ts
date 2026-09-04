import { describe, it, expect } from "vitest";
import {
  calculateVermittlungsbudget,
  generateReimbursementApplicationHtml,
  DEFAULT_BUDGET_SETTINGS,
} from "./vermittlungsbudget";
import type { ApplicationListItem } from "@/types";

describe("vermittlungsbudget", () => {
  const sampleApps: ApplicationListItem[] = [
    {
      id: "app-1",
      position: "Frontend Dev",
      status: "SENT",
      applicationDate: "2026-08-01T10:00:00Z",
      nextStep: null,
      nextStepDate: null,
      meetingUrl: null,
      rejectionReason: null,
      interviewStage: null,
      timeSpentMinutes: 30,
      tags: null,
      notes: null,
      source: "Stepstone",
      createdAt: "2026-08-01T10:00:00Z",
      updatedAt: "2026-08-01T10:00:00Z",
      company: { id: "c-1", name: "Firma A" },
      jobPosting: null,
    },
    {
      id: "app-2",
      position: "React Dev",
      status: "INTERVIEW",
      applicationDate: "2026-08-02T10:00:00Z",
      nextStep: null,
      nextStepDate: null,
      meetingUrl: null,
      rejectionReason: null,
      interviewStage: "TECH_INTERVIEW",
      timeSpentMinutes: 30,
      tags: null,
      notes: null,
      source: null,
      createdAt: "2026-08-02T10:00:00Z",
      updatedAt: "2026-08-02T10:00:00Z",
      company: { id: "c-2", name: "Firma B" },
      jobPosting: null,
    },
    {
      id: "app-3",
      position: "Draft Dev",
      status: "DRAFT",
      applicationDate: null,
      nextStep: null,
      nextStepDate: null,
      meetingUrl: null,
      rejectionReason: null,
      interviewStage: null,
      timeSpentMinutes: 0,
      tags: null,
      notes: null,
      source: null,
      createdAt: "2026-08-03T10:00:00Z",
      updatedAt: "2026-08-03T10:00:00Z",
      company: { id: "c-3", name: "Firma C" },
      jobPosting: null,
    },
  ] as unknown as ApplicationListItem[];

  it("berechnet Erstattungsanspruch ohne Entwürfe", () => {
    const calc = calculateVermittlungsbudget(sampleApps, DEFAULT_BUDGET_SETTINGS);

    expect(calc.totalApplicationsCount).toBe(2);
    expect(calc.totalReimbursement).toBe(10.0);
    expect(calc.remainingAnnualBudget).toBe(250.0);
    expect(calc.interviewsCount).toBe(1);
  });

  it("generiert amtliches HTML-Formular für § 44 SGB III", () => {
    const calc = calculateVermittlungsbudget(sampleApps);
    const html = generateReimbursementApplicationHtml({
      candidateName: "Erika Mustermann",
      candidateAddress: "Musterweg 5, 53111 Bonn",
      customerId: "BG-98765",
      calculation: calc,
    });

    expect(html).toContain("Antrag auf Erstattung von Bewerbungskosten");
    expect(html).toContain("§ 44 Drittes Buch Sozialgesetzbuch (SGB III)");
    expect(html).toContain("Erika Mustermann");
    expect(html).toContain("BG-98765");
    expect(html).toContain("10.00 €");
    expect(html).toContain("Firma A");
    expect(html).toContain("Firma B");
  });
});
