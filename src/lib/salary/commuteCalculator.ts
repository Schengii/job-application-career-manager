// -----------------------------------------------------------------------------
// Pendelzeit-, Fahrtkosten- & Remote-Netto-Rechner
// -----------------------------------------------------------------------------
// Berechnet für Stellen im Raum Bonn / Köln / Ruhrgebiet / Remote die realen
// Pendelkosten (PKW Sprit + Abnutzung vs. ÖPNV / Deutschlandticket),
// den monatlichen Zeitverlust im Berufsverkehr sowie das tatsächliche
// "Netto nach Pendeln" und den effektiven Stundenlohn.
// -----------------------------------------------------------------------------

export type CommuteTransitMode = "CAR" | "TRANSIT_DEUTSCHLANDTICKET" | "BIKE_WALK";

export interface CommuteCalculationInput {
  grossSalaryAnnual: number;
  officeDaysPerWeek: number; // 0 (100% Remote) bis 5 (Vor Ort)
  distanceKmOneWay: number; // Einfache Strecke in km (z. B. Bonn -> Köln: ca. 30 km)
  travelTimeMinutesOneWay: number; // Einfache Fahrzeit in Minuten
  transitMode: CommuteTransitMode;
  carFuelConsumptionLitersPer100Km?: number; // Standard: 7.0 L
  fuelPricePerLiter?: number; // Standard: 1.80 €
  carWearAndTearPerKm?: number; // Verschleiß/Wartung/Wertverlust pro km (Standard: 0.15 €)
  transitMonthlyPassEur?: number; // Deutschlandticket Standard: 58.00 € (ab 2025)
  employerTransitSubsidyMonthlyEur?: number; // Arbeitgeberzuschuss (Jobticket)
  workWeeksPerYear?: number; // Standard: 46 Wochen (nach Urlaub & Feiertagen)
  weeklyWorkingHours?: number; // Standard: 40 Stunden
}

export interface CommuteCalculationResult {
  monthlyGross: number;
  estimatedMonthlyNet: number; // Ca. 60% bei StKl 1
  monthlyCommuteCostEur: number;
  annualCommuteCostEur: number;
  monthlyCommuteHours: number;
  annualCommuteHours: number;
  netAfterCommuteEur: number;
  nominalHourlyWageNet: number;
  effectiveHourlyWageNet: number; // Netto bezogen auf (Arbeitszeit + Pendelzeit)
  commuteCostBreakdown: {
    directExpenseMonthly: number;
    wearAndTearMonthly: number;
    employerSubsidyMonthly: number;
  };
  recommendation: string;
}

export function calculateCommuteAndRemoteNet(
  input: CommuteCalculationInput
): CommuteCalculationResult {
  const {
    grossSalaryAnnual,
    officeDaysPerWeek,
    distanceKmOneWay,
    travelTimeMinutesOneWay,
    transitMode,
    carFuelConsumptionLitersPer100Km = 7.0,
    fuelPricePerLiter = 1.8,
    carWearAndTearPerKm = 0.15,
    transitMonthlyPassEur = 58.0,
    employerTransitSubsidyMonthlyEur = 0,
    workWeeksPerYear = 46,
    weeklyWorkingHours = 40,
  } = input;

  const monthlyGross = Math.round(grossSalaryAnnual / 12);
  // Realistische Annahme Steuerklasse 1 in Deutschland (~60% Netto)
  const estimatedMonthlyNet = Math.round(monthlyGross * 0.6);

  // Jahres-Tage im Büro
  const annualOfficeDays = Math.max(0, officeDaysPerWeek) * Math.max(1, workWeeksPerYear);
  const monthlyOfficeDays = annualOfficeDays / 12;

  // Zeitaufwand
  const dailyCommuteMinutes = officeDaysPerWeek > 0 ? travelTimeMinutesOneWay * 2 : 0;
  const annualCommuteHours = Math.round((dailyCommuteMinutes * annualOfficeDays) / 60);
  const monthlyCommuteHours = Math.round(annualCommuteHours / 12);

  // Kostenberechnung
  let directExpenseMonthly = 0;
  let wearAndTearMonthly = 0;

  if (officeDaysPerWeek > 0) {
    if (transitMode === "CAR") {
      const dailyKmTotal = distanceKmOneWay * 2;
      const fuelCostPerKm = (carFuelConsumptionLitersPer100Km / 100) * fuelPricePerLiter;
      const fuelCostDaily = dailyKmTotal * fuelCostPerKm;
      const wearCostDaily = dailyKmTotal * carWearAndTearPerKm;

      directExpenseMonthly = Math.round(fuelCostDaily * monthlyOfficeDays);
      wearAndTearMonthly = Math.round(wearCostDaily * monthlyOfficeDays);
    } else if (transitMode === "TRANSIT_DEUTSCHLANDTICKET") {
      directExpenseMonthly = Math.round(transitMonthlyPassEur);
      wearAndTearMonthly = 0;
    } else {
      // BIKE_WALK
      directExpenseMonthly = 0;
      wearAndTearMonthly = 0;
    }
  }

  const effectiveEmployerSubsidy = Math.min(employerTransitSubsidyMonthlyEur, directExpenseMonthly);
  const totalCommuteCostMonthly = Math.max(
    0,
    directExpenseMonthly + wearAndTearMonthly - effectiveEmployerSubsidy
  );
  const annualCommuteCostEur = totalCommuteCostMonthly * 12;

  // Reales Netto nach Pendelkosten
  const netAfterCommuteEur = Math.max(0, estimatedMonthlyNet - totalCommuteCostMonthly);

  // Arbeitsstunden pro Monat
  const monthlyWorkHours = Math.round((weeklyWorkingHours * workWeeksPerYear) / 12);
  const nominalHourlyWageNet = Math.round((estimatedMonthlyNet / Math.max(1, monthlyWorkHours)) * 100) / 100;

  // Effektiver Stundenlohn (bezogen auf Arbeitszeit + investierte Pendelzeit)
  const totalTimeInvestedHoursMonthly = monthlyWorkHours + monthlyCommuteHours;
  const effectiveHourlyWageNet =
    Math.round((netAfterCommuteEur / Math.max(1, totalTimeInvestedHoursMonthly)) * 100) / 100;

  // Handlungsempfehlung
  let recommendation = "";
  if (officeDaysPerWeek === 0) {
    recommendation = "100% Remote: 0 € Fahrtkosten und 0 Stunden Zeitverlust im Pendelverkehr. Maximaler Stundenlohn!";
  } else if (transitMode === "CAR" && directExpenseMonthly + wearAndTearMonthly > 250) {
    recommendation = `Hohe PKW-Kosten (~${directExpenseMonthly + wearAndTearMonthly} €/Monat). Prüfe die Option Deutschlandticket oder mindestens 1 zusätzlichen Home-Office-Tag.`;
  } else if (monthlyCommuteHours > 30) {
    recommendation = `Hoher Zeitverlust (~${monthlyCommuteHours}h/Monat). Effektiver Stundenlohn sinkt um ${(nominalHourlyWageNet - effectiveHourlyWageNet).toFixed(2)} €/h.`;
  } else {
    recommendation = "Ausgewogenes Verhältnis aus Pendelaufwand und Vergütung.";
  }

  return {
    monthlyGross,
    estimatedMonthlyNet,
    monthlyCommuteCostEur: totalCommuteCostMonthly,
    annualCommuteCostEur,
    monthlyCommuteHours,
    annualCommuteHours,
    netAfterCommuteEur,
    nominalHourlyWageNet,
    effectiveHourlyWageNet,
    commuteCostBreakdown: {
      directExpenseMonthly,
      wearAndTearMonthly,
      employerSubsidyMonthly: effectiveEmployerSubsidy,
    },
    recommendation,
  };
}
