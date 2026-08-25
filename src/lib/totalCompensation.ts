// -----------------------------------------------------------------------------
// Total Compensation & Benefit Calculator
// -----------------------------------------------------------------------------
// Berechnet das tatsächliche Gesamteinkommen (Total Comp) inklusive 13. Gehalt,
// Boni, bAV, Deutschlandticket, Home-Office Pauschale, Weiterbildungsbudget
// und ermittelt den realen Stundenlohn (unter Berücksichtigung von Wochenstunden,
// Urlaubstagen und Pendelzeit).
// -----------------------------------------------------------------------------

export interface CompensationOffer {
  id: string;
  companyName: string;
  role: string;
  baseSalaryYear: number; // z. B. 48.000 €
  monthsPerYear: number; // 12 oder 13
  bonusYear?: number; // z. B. 3.000 €
  bavEmployerShareMonth?: number; // z. B. 50 €
  transitPassYear?: number; // z. B. 588 € (Deutschlandticket)
  homeOfficeAllowanceYear?: number; // z. B. 600 €
  learningBudgetYear?: number; // z. B. 1.500 €
  hardwareBudgetYear?: number; // z. B. 1.000 €
  weeklyHours: number; // z. B. 38 oder 40
  vacationDays: number; // z. B. 30
  homeOfficeDaysPerWeek: number; // z. B. 3
  commuteTimeMinutesOneWay: number; // z. B. 35
}

export interface CompensationResult {
  offer: CompensationOffer;
  totalDirectCashYear: number; // Grundgehalt + 13. Gehalt + Bonus
  totalMonetaryBenefitsYear: number; // bAV + Ticket + HomeOffice + Hardware + Weiterbildung
  totalCompensationYear: number; // Gesamtwert pro Jahr
  estimatedNettoYear: number; // Ca. 60% Netto-Heuristik für Steuerklasse 1
  estimatedNettoMonth: number;
  effectiveHourlyRate: number; // Gesamtvergütung / (Reale Netto-Arbeitsstunden + Pendelstunden)
  yearlyWorkingHours: number;
  yearlyCommuteHours: number;
  negotiationLevers: string[];
}

export function calculateTotalCompensation(offer: CompensationOffer): CompensationResult {
  // Grundgehalt berechnen
  const monthlyBase = offer.baseSalaryYear / 12;
  const totalDirectCashYear =
    offer.monthsPerYear === 13
      ? offer.baseSalaryYear + monthlyBase + (offer.bonusYear || 0)
      : offer.baseSalaryYear + (offer.bonusYear || 0);

  const bavYear = (offer.bavEmployerShareMonth || 0) * 12;
  const transitYear = offer.transitPassYear || 0;
  const homeOfficeYear = offer.homeOfficeAllowanceYear || 0;
  const learningYear = offer.learningBudgetYear || 0;
  const hardwareYear = offer.hardwareBudgetYear || 0;

  const totalMonetaryBenefitsYear = bavYear + transitYear + homeOfficeYear + learningYear + hardwareYear;
  const totalCompensationYear = totalDirectCashYear + totalMonetaryBenefitsYear;

  // Grobe Netto-Heuristik für Deutschland (SK1, keine Kinder): ca. 58-62%
  const estimatedNettoYear = Math.round(totalDirectCashYear * 0.6);
  const estimatedNettoMonth = Math.round(estimatedNettoYear / 12);

  // Arbeitszeit-Berechnung:
  // 52 Wochen minus Urlaubstage (in Wochen) minus Feiertage (ca. 10 Tage = 2 Wochen)
  const vacationWeeks = offer.vacationDays / 5;
  const workWeeksPerYear = Math.max(40, 52 - vacationWeeks - 2);
  const yearlyWorkingHours = Math.round(workWeeksPerYear * offer.weeklyHours);

  // Pendelzeit-Berechnung:
  const onsiteDaysPerWeek = Math.max(0, 5 - offer.homeOfficeDaysPerWeek);
  const weeklyCommuteMinutes = onsiteDaysPerWeek * (offer.commuteTimeMinutesOneWay * 2);
  const yearlyCommuteHours = Math.round((weeklyCommuteMinutes * workWeeksPerYear) / 60);

  const totalInvestedHours = yearlyWorkingHours + yearlyCommuteHours;
  const effectiveHourlyRate =
    totalInvestedHours > 0 ? Math.round((totalCompensationYear / totalInvestedHours) * 100) / 100 : 0;

  // Verhandlungs-Hebel analysieren
  const negotiationLevers: string[] = [];
  if (offer.weeklyHours > 38.5) {
    negotiationLevers.push("Reduzierung der Wochenarbeitszeit auf 38,5h oder 37h (Tarifniveau) ansprechen.");
  }
  if (offer.vacationDays < 30) {
    negotiationLevers.push("Erhöhung der Urlaubstage von " + offer.vacationDays + " auf 30 Tage verhandeln.");
  }
  if (!offer.transitPassYear) {
    negotiationLevers.push("Deutschlandticket / Jobticket als steuerfreien Sachbezug anfragen.");
  }
  if (!offer.learningBudgetYear) {
    negotiationLevers.push("Fester Weiterbildungs-Etat (z.B. Konferenzen, Zertifizierungen) vereinbaren.");
  }
  if (offer.homeOfficeDaysPerWeek < 3) {
    negotiationLevers.push("Mehr Home-Office Tage spart jährlich ca. " + (yearlyCommuteHours / 2) + " Stunden Pendelzeit.");
  }

  return {
    offer,
    totalDirectCashYear,
    totalMonetaryBenefitsYear,
    totalCompensationYear,
    estimatedNettoYear,
    estimatedNettoMonth,
    effectiveHourlyRate,
    yearlyWorkingHours,
    yearlyCommuteHours,
    negotiationLevers,
  };
}

export function generateNegotiationEmailScript(
  currentOffer: CompensationResult,
  targetSalary: number,
  candidateName: string = "Alexander Schepp"
): string {
  const diff = targetSalary - currentOffer.offer.baseSalaryYear;
  return `Sehr geehrte/r [Ansprechpartner],

vielen Dank für das freundliche Gespräch und die Zusendung des Vertragsangebots für die Position als ${currentOffer.offer.role}. Die vorgestellten Projekte und die Zusammenarbeit mit dem Team bestärken mich sehr in meinem Wunsch, bei ${currentOffer.offer.companyName} zu starten.

Nach sorgfältiger Durchsicht der Rahmenbedingungen möchte ich mich gerne über die Gehaltskomponente austauschen. Angesichts meiner praktischen Vorerfahrung in der Entwicklung mit Next.js, React und TypeScript sowie der schnellen Einarbeitung in eure Codebase liege ich bei meiner Gehaltserwartung bei ${targetSalary.toLocaleString("de-DE")} € brutto pro Jahr.

Ich bin überzeugt, vom ersten Tag an eigenverantwortlich und mit hoher Code-Qualität zum Teamerfolg beizutragen. Wäre es möglich, das Angebot in diesem Rahmen anzupassen oder durch zusätzliche Bausteine (z. B. Weiterbildungsbudget / Jobticket) zu ergänzen?

Ich freue mich auf die Rückmeldung und stehe gerne für ein kurzes Gespräch zur Verfügung.

Mit freundlichen Grüßen
${candidateName}`;
}
