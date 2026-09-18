import { describe, expect, it } from "vitest";
import {
  scoreOffersWithWeights,
  DEFAULT_WEIGHTS,
  type ComprehensiveJobOffer,
} from "@/lib/salary/offerComparison";

describe("scoreOffersWithWeights", () => {
  const sampleOffers: ComprehensiveJobOffer[] = [
    {
      id: "offer-1",
      companyName: "Konzern AG",
      position: "Frontend Architect",
      baseSalaryAnnual: 65000,
      homeOfficeDaysPerWeek: 2,
      vacationDays: 30,
      techStackRating: 4,
      cultureRating: 3,
      commuteMinutesOneWay: 45,
      educationBudgetAnnual: 2000,
      publicTransportCovered: true,
    },
    {
      id: "offer-2",
      companyName: "Remote Startup",
      position: "React / Next.js Engineer",
      baseSalaryAnnual: 55000,
      homeOfficeDaysPerWeek: 5,
      vacationDays: 30,
      techStackRating: 5,
      cultureRating: 5,
      commuteMinutesOneWay: 0,
      educationBudgetAnnual: 3000,
      publicTransportCovered: false,
    },
  ];

  it("berechnet Scores für alle Angebote und ermittelt Ränge", () => {
    const scored = scoreOffersWithWeights(sampleOffers, DEFAULT_WEIGHTS);
    expect(scored).toHaveLength(2);
    expect(scored[0].rank).toBe(1);
    expect(scored[1].rank).toBe(2);
    expect(scored[0].totalDecisionScore).toBeGreaterThanOrEqual(scored[1].totalDecisionScore);
  });

  it("ändert den Gewinner, wenn Work-Life höher gewichtet wird als Gehalt", () => {
    // Wenn Gehalt 80% wiegt, gewinnt Konzern AG (65k)
    const salaryFocusWeights = {
      salaryWeight: 80,
      workLifeWeight: 10,
      techStackWeight: 5,
      cultureBenefitsWeight: 5,
    };
    const scoredSalaryFocus = scoreOffersWithWeights(sampleOffers, salaryFocusWeights);
    expect(scoredSalaryFocus[0].companyName).toBe("Konzern AG");

    // Wenn Work-Life & Tech-Stack 80% wiegen, gewinnt Remote Startup (100% Homeoffice, Top Stack)
    const workLifeFocusWeights = {
      salaryWeight: 10,
      workLifeWeight: 60,
      techStackWeight: 20,
      cultureBenefitsWeight: 10,
    };
    const scoredWlbFocus = scoreOffersWithWeights(sampleOffers, workLifeFocusWeights);
    expect(scoredWlbFocus[0].companyName).toBe("Remote Startup");
  });

  it("behandelt leere Angebots-Listen sauber", () => {
    const empty = scoreOffersWithWeights([]);
    expect(empty).toEqual([]);
  });
});
