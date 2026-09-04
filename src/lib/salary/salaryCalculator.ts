// -----------------------------------------------------------------------------
// Gehalts- & Benefit-Vergleichsrechner
// -----------------------------------------------------------------------------
// Vergleicht mehrere Jobangebote anhand von Gehalt, Home-Office, Urlaubstagen
// und Zusatzleistungen.
// -----------------------------------------------------------------------------

export type JobOffer = {
  id: string;
  companyName: string;
  position: string;
  baseSalaryAnnual: number; // in EUR
  homeOfficeDaysPerWeek: number; // 0 bis 5
  vacationDays: number; // z.B. 28, 30
  educationBudgetAnnual?: number; // in EUR
  annualBonus?: number; // in EUR
  publicTransportCovered?: boolean;
};

export type CalculatedOffer = JobOffer & {
  baseSalaryMonthly: number;
  estimatedNetMonthly: number;
  commuteDaysAnnual: number;
  estimatedCommuteSavingsAnnual: number;
  totalCompensationScore: number;
};

export function calculateOfferScore(offer: JobOffer): CalculatedOffer {
  const baseSalaryMonthly = Math.round(offer.baseSalaryAnnual / 12);

  // Solide deutsche Netto-Approximation für Steuerklasse 1 (ca. 58-62% vom Brutto)
  const estimatedNetMonthly = Math.round(baseSalaryMonthly * 0.60);

  // 220 Arbeitstage/Jahr abzüglich Urlaub
  const workDaysPerYear = Math.max(180, 250 - offer.vacationDays);
  const homeOfficeRatio = Math.min(1, Math.max(0, offer.homeOfficeDaysPerWeek / 5));
  const onsiteDaysPerYear = Math.round(workDaysPerYear * (1 - homeOfficeRatio));
  const homeOfficeDaysAnnual = workDaysPerYear - onsiteDaysPerYear;

  // Geschätzte Pendelkostenersparnis (ca. 10 € pro Home-Office-Tag für Fahrt/Ticket/Zeit)
  const estimatedCommuteSavingsAnnual = homeOfficeDaysAnnual * 12;

  // Gesamt-Score (Gewichtung: 50% Gehalt, 20% Home-Office, 15% Urlaub, 15% Benefits)
  // Normierung auf Basis eines 50.000 € Referenzgehalts
  const salaryPoints = (offer.baseSalaryAnnual / 50000) * 50;
  const homeOfficePoints = (offer.homeOfficeDaysPerWeek / 5) * 20;
  const vacationPoints = (Math.max(20, offer.vacationDays) / 30) * 15;
  const benefitPoints =
    ((offer.educationBudgetAnnual ? Math.min(offer.educationBudgetAnnual, 3000) / 3000 : 0) * 8) +
    ((offer.annualBonus ? Math.min(offer.annualBonus, 10000) / 10000 : 0) * 4) +
    (offer.publicTransportCovered ? 3 : 0);

  const totalCompensationScore = Math.round(salaryPoints + homeOfficePoints + vacationPoints + benefitPoints);

  return {
    ...offer,
    baseSalaryMonthly,
    estimatedNetMonthly,
    commuteDaysAnnual: onsiteDaysPerYear,
    estimatedCommuteSavingsAnnual,
    totalCompensationScore,
  };
}
