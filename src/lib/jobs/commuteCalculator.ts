// -----------------------------------------------------------------------------
// NRW & Remote Pendel-, Fahrzeit- & Benefit-Rechner
// -----------------------------------------------------------------------------

export interface CommuteEstimate {
  destination: string;
  isRemote: boolean;
  transitMinutes: number;
  carMinutes: number;
  monthlyTransitCost: number; // in €
  annualHomeOfficeSavingsHours: number; // bei 2-3 Tagen HO
  co2SavingsKgPerYear: number;
}

const NRW_COMMUTE_MATRIX: Record<
  string,
  { transitMinutes: number; carMinutes: number; baseDistanceKm: number }
> = {
  bonn: { transitMinutes: 15, carMinutes: 15, baseDistanceKm: 8 },
  köln: { transitMinutes: 28, carMinutes: 35, baseDistanceKm: 32 },
  düsseldorf: { transitMinutes: 48, carMinutes: 60, baseDistanceKm: 70 },
  dortmund: { transitMinutes: 80, carMinutes: 95, baseDistanceKm: 115 },
  essen: { transitMinutes: 75, carMinutes: 90, baseDistanceKm: 105 },
  bochum: { transitMinutes: 82, carMinutes: 95, baseDistanceKm: 110 },
  sankt_augustin: { transitMinutes: 20, carMinutes: 15, baseDistanceKm: 12 },
};

export function estimateCommute(
  jobLocation: string,
  remote: boolean = false,
  homeOfficeDaysPerWeek: number = 2
): CommuteEstimate {
  if (remote || jobLocation.toLowerCase().includes("remote")) {
    return {
      destination: "100% Remote / Home-Office",
      isRemote: true,
      transitMinutes: 0,
      carMinutes: 0,
      monthlyTransitCost: 0,
      annualHomeOfficeSavingsHours: Math.round(5 * 52 * 1.5), // ca. 390 Std./Jahr
      co2SavingsKgPerYear: 850,
    };
  }

  const locLower = jobLocation.toLowerCase();
  let matrixKey = "bonn";

  if (locLower.includes("köln") || locLower.includes("koeln")) matrixKey = "köln";
  else if (locLower.includes("düsseldorf") || locLower.includes("duesseldorf")) matrixKey = "düsseldorf";
  else if (locLower.includes("dortmund")) matrixKey = "dortmund";
  else if (locLower.includes("essen")) matrixKey = "essen";
  else if (locLower.includes("bochum")) matrixKey = "bochum";
  else if (locLower.includes("sankt augustin") || locLower.includes("augustin")) matrixKey = "sankt_augustin";

  const matrix = NRW_COMMUTE_MATRIX[matrixKey] || NRW_COMMUTE_MATRIX.bonn;

  // Deutschlandticket ca. 58 € / Monat
  const monthlyTransitCost = matrixKey === "bonn" ? 0 : 58;

  // Ersparnis durch Home-Office-Tage
  const weeklyCommuteMinutesSaved = homeOfficeDaysPerWeek * (matrix.transitMinutes * 2);
  const annualSavingsHours = Math.round((weeklyCommuteMinutesSaved * 46) / 60);
  const co2Savings = Math.round(homeOfficeDaysPerWeek * matrix.baseDistanceKm * 0.15 * 46);

  return {
    destination: jobLocation,
    isRemote: false,
    transitMinutes: matrix.transitMinutes,
    carMinutes: matrix.carMinutes,
    monthlyTransitCost,
    annualHomeOfficeSavingsHours: annualSavingsHours,
    co2SavingsKgPerYear: co2Savings,
  };
}
