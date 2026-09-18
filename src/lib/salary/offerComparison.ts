// -----------------------------------------------------------------------------
// Erweiterte Angebots-Vergleichs- & Decision-Matrix (Nutzenwertanalyse)
// -----------------------------------------------------------------------------

export interface DecisionCriteriaWeights {
  salaryWeight: number; // z.B. 40 (%)
  workLifeWeight: number; // z.B. 25 (%) - Homeoffice & Urlaub
  techStackWeight: number; // z.B. 20 (%) - Moderner Stack & Weiterbildung
  cultureBenefitsWeight: number; // z.B. 15 (%) - Benefits, ÖPNV, Teamkultur
}

export const DEFAULT_WEIGHTS: DecisionCriteriaWeights = {
  salaryWeight: 40,
  workLifeWeight: 25,
  techStackWeight: 20,
  cultureBenefitsWeight: 15,
};

export interface ComprehensiveJobOffer {
  id: string;
  companyName: string;
  position: string;
  baseSalaryAnnual: number;
  homeOfficeDaysPerWeek: number; // 0 bis 5
  vacationDays: number; // z.B. 28 bis 35
  educationBudgetAnnual?: number;
  annualBonus?: number;
  publicTransportCovered?: boolean;
  techStackRating?: number; // 1 bis 5 Sterne
  cultureRating?: number; // 1 bis 5 Sterne
  commuteMinutesOneWay?: number;
  notes?: string;
}

export interface ScoredJobOffer extends ComprehensiveJobOffer {
  baseSalaryMonthly: number;
  estimatedNetMonthly: number;
  salaryScore: number; // 0-100
  workLifeScore: number; // 0-100
  techStackScore: number; // 0-100
  cultureBenefitsScore: number; // 0-100
  totalDecisionScore: number; // 0-100 gewichtet
  rank: number;
  isBestOffer: boolean;
}

/**
 * Berechnet für ein Angebot normalisierte Teil-Scores (0-100) und einen gewichteten Gesamt-Decision-Score.
 */
export function scoreOffersWithWeights(
  offers: ComprehensiveJobOffer[],
  weights: DecisionCriteriaWeights = DEFAULT_WEIGHTS
): ScoredJobOffer[] {
  if (offers.length === 0) return [];

  const maxSalary = Math.max(...offers.map((o) => o.baseSalaryAnnual), 50000);

  const scoredList = offers.map((offer) => {
    const baseSalaryMonthly = Math.round(offer.baseSalaryAnnual / 12);
    // Solide Netto-Schätzung für Single (ca. 60%)
    const estimatedNetMonthly = Math.round(baseSalaryMonthly * 0.6);

    // 1. Gehaltsscore (0 - 100): Relativ zum Maximalangebot oder min 50k
    const salaryScore = Math.min(100, Math.round((offer.baseSalaryAnnual / maxSalary) * 100));

    // 2. Work-Life Score (0 - 100): Homeoffice (0-50 Pkt), Urlaub (0-30 Pkt), Pendelzeit (0-20 Pkt)
    const hoPoints = (Math.min(5, Math.max(0, offer.homeOfficeDaysPerWeek)) / 5) * 50;
    const vacPoints = (Math.min(35, Math.max(20, offer.vacationDays)) / 35) * 30;
    const commuteTime = offer.commuteMinutesOneWay ?? 30;
    const commutePoints = Math.max(0, 20 - (commuteTime / 60) * 20);
    const workLifeScore = Math.min(100, Math.round(hoPoints + vacPoints + commutePoints));

    // 3. Tech-Stack Score (0 - 100): 1-5 Sterne (je 15 Pkt = max 75) + Weiterbildungsbudget (max 25 Pkt)
    const techStars = Math.min(5, Math.max(1, offer.techStackRating ?? 3));
    const eduBudget = offer.educationBudgetAnnual ?? 1000;
    const eduPoints = Math.min(25, (eduBudget / 2500) * 25);
    const techStackScore = Math.min(100, Math.round(techStars * 15 + eduPoints));

    // 4. Kultur & Benefits Score (0 - 100): Kultur-Sterne (max 50) + Bonus (max 25) + ÖPNV (25)
    const cultStars = Math.min(5, Math.max(1, offer.cultureRating ?? 3));
    const bonusPoints = offer.annualBonus ? Math.min(25, (offer.annualBonus / 5000) * 25) : 0;
    const transitPoints = offer.publicTransportCovered ? 25 : 0;
    const cultureBenefitsScore = Math.min(100, Math.round(cultStars * 10 + bonusPoints + transitPoints));

    // Gesamtscore berechnen basierend auf Gewichtung
    const totalWeight =
      weights.salaryWeight + weights.workLifeWeight + weights.techStackWeight + weights.cultureBenefitsWeight || 1;

    const weightedScore =
      (salaryScore * weights.salaryWeight +
        workLifeScore * weights.workLifeWeight +
        techStackScore * weights.techStackWeight +
        cultureBenefitsScore * weights.cultureBenefitsWeight) /
      totalWeight;

    const totalDecisionScore = Math.round(weightedScore);

    return {
      ...offer,
      baseSalaryMonthly,
      estimatedNetMonthly,
      salaryScore,
      workLifeScore,
      techStackScore,
      cultureBenefitsScore,
      totalDecisionScore,
      rank: 1,
      isBestOffer: false,
    };
  });

  // Sortieren nach totalDecisionScore absteigend und Ränge vergeben
  scoredList.sort((a, b) => b.totalDecisionScore - a.totalDecisionScore);

  const highestScore = scoredList[0]?.totalDecisionScore ?? 0;

  return scoredList.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    isBestOffer: item.totalDecisionScore === highestScore && scoredList.length > 1,
  }));
}
