// -----------------------------------------------------------------------------
// Multi-Währungs- & Relocation-Rechner (Kaufkraftparität & Remote-Netto)
// -----------------------------------------------------------------------------
// Berechnet für internationale oder überregionale Jobangebote (USD, CHF, GBP, EUR)
// den nominalen Wechselkurs, das kaufkraftbereinigte Gehalt und das geschätzte Netto.
// -----------------------------------------------------------------------------

export type CurrencyCode = "EUR" | "USD" | "CHF" | "GBP";

export type LocationHub =
  | "BONN_KOELN"
  | "BERLIN_FRANKFURT"
  | "MUENCHEN"
  | "ZUERICH_CH"
  | "LONDON_UK"
  | "US_REMOTE"
  | "DE_REMOTE";

export type LocationProfile = {
  id: LocationHub;
  label: string;
  country: string;
  defaultCurrency: CurrencyCode;
  costOfLivingIndex: number; // Basis Bonn/Köln = 100
  estimatedNetRatio: number; // Geschätzte Nettoquote (nach Steuern & Sozialabgaben)
  notes: string;
};

export const LOCATION_PROFILES: Record<LocationHub, LocationProfile> = {
  BONN_KOELN: {
    id: "BONN_KOELN",
    label: "Bonn / Köln / Rheinland",
    country: "Deutschland",
    defaultCurrency: "EUR",
    costOfLivingIndex: 100,
    estimatedNetRatio: 0.60, // Steuerklasse 1
    notes: "Heimat-Referenzstandort mit moderaten Lebenshaltungskosten.",
  },
  BERLIN_FRANKFURT: {
    id: "BERLIN_FRANKFURT",
    label: "Berlin / Frankfurt a.M.",
    country: "Deutschland",
    defaultCurrency: "EUR",
    costOfLivingIndex: 112,
    estimatedNetRatio: 0.60,
    notes: "Höhere Mietpreise; ca. 12% höhere Lebenshaltungskosten.",
  },
  MUENCHEN: {
    id: "MUENCHEN",
    label: "München",
    country: "Deutschland",
    defaultCurrency: "EUR",
    costOfLivingIndex: 130,
    estimatedNetRatio: 0.60,
    notes: "Höchster Mietspiegel in Deutschland (+30% vs. Bonn).",
  },
  ZUERICH_CH: {
    id: "ZUERICH_CH",
    label: "Zürich / Schweiz (Vor Ort / Hybrid)",
    country: "Schweiz",
    defaultCurrency: "CHF",
    costOfLivingIndex: 175,
    estimatedNetRatio: 0.80, // Schweizer Quellensteuer + Pensionskasse (~20% Abzug)
    notes: "Deutlich höhere Lebenshaltungskosten (+75%), aber sehr niedrige Steuerquote (~20%).",
  },
  LONDON_UK: {
    id: "LONDON_UK",
    label: "London / Großbritannien",
    country: "UK",
    defaultCurrency: "GBP",
    costOfLivingIndex: 145,
    estimatedNetRatio: 0.70, // PAYE Income Tax + National Insurance
    notes: "Hohe Wohnkosten; Gehalt in Pfund Sterling.",
  },
  US_REMOTE: {
    id: "US_REMOTE",
    label: "US-Tech Remote (W-8BEN / Contractor)",
    country: "USA / Global",
    defaultCurrency: "USD",
    costOfLivingIndex: 100, // Leben in DE, Einkommen aus den USA
    estimatedNetRatio: 0.55, // Freiberufliche Versteuerung / Gewerbe in DE
    notes: "US-Dollar-Vergütung; Versteuerung & Krankenversicherung in Deutschland.",
  },
  DE_REMOTE: {
    id: "DE_REMOTE",
    label: "100% Remote (Wohnort Bonn)",
    country: "Deutschland",
    defaultCurrency: "EUR",
    costOfLivingIndex: 95,
    estimatedNetRatio: 0.60,
    notes: "Minimale Pendelkosten, maximale zeitliche Flexibilität.",
  },
};

// Feste Referenzwechselkurse (1 EUR =)
export const FX_RATES: Record<CurrencyCode, number> = {
  EUR: 1.0,
  USD: 1.08, // 1 EUR = 1.08 USD  => 1 USD = 0.926 EUR
  CHF: 0.96, // 1 EUR = 0.96 CHF  => 1 CHF = 1.042 EUR
  GBP: 0.85, // 1 EUR = 0.85 GBP  => 1 GBP = 1.176 EUR
};

export type RelocationCalculationInput = {
  nominalSalaryAnnual: number;
  currency: CurrencyCode;
  targetLocation: LocationHub;
  baseLocation?: LocationHub;
};

export type RelocationCalculationResult = {
  nominalSalary: number;
  currency: CurrencyCode;
  salaryInEur: number;
  purchasingPowerAdjustedEur: number;
  estimatedNetAnnualEur: number;
  estimatedNetMonthlyEur: number;
  purchasingPowerIndex: number;
  recommendation: string;
};

export function calculateRelocationCompensation(
  input: RelocationCalculationInput
): RelocationCalculationResult {
  const { nominalSalaryAnnual, currency, targetLocation, baseLocation = "BONN_KOELN" } = input;
  const targetProfile = LOCATION_PROFILES[targetLocation] || LOCATION_PROFILES.BONN_KOELN;
  const baseProfile = LOCATION_PROFILES[baseLocation] || LOCATION_PROFILES.BONN_KOELN;

  // 1. Umrechnung in EUR
  const rateToEur = 1 / (FX_RATES[currency] || 1.0);
  const salaryInEur = Math.round(nominalSalaryAnnual * rateToEur);

  // 2. Kaufkraftbereinigung (Purchasing Power Parity)
  // Reales Kaufkraft-Äquivalent in der Heimatregion Bonn/Köln
  const pppFactor = baseProfile.costOfLivingIndex / targetProfile.costOfLivingIndex;
  const purchasingPowerAdjustedEur = Math.round(salaryInEur * pppFactor);

  // 3. Geschätztes Jahres- & Monatsnetto in EUR
  const estimatedNetAnnualEur = Math.round(salaryInEur * targetProfile.estimatedNetRatio);
  const estimatedNetMonthlyEur = Math.round(estimatedNetAnnualEur / 12);

  // 4. Kaufkraft-Index (100 = identisch zum nominalen Brutto in Bonn)
  const purchasingPowerIndex = Math.round((purchasingPowerAdjustedEur / (salaryInEur || 1)) * 100);

  // 5. Automatische Empfehlung
  let recommendation = "";
  if (targetLocation === "ZUERICH_CH") {
    recommendation =
      "Aufgrund der niedrigen Schweizer Steuerquote (~20%) bleibt trotz hoher Lebenshaltungskosten ein starker Kaufkraftgewinn.";
  } else if (targetLocation === "US_REMOTE") {
    recommendation =
      "US-Remote-Angebote bieten oft hohe Bruttogehälter; beachte bei W-8BEN-Verträgen die eigenständige Versteuerung und Krankenversicherung in DE.";
  } else if (purchasingPowerIndex < 85) {
    recommendation = `Die Lebenshaltungskosten in ${targetProfile.label} mindern die reale Kaufkraft um ca. ${100 - purchasingPowerIndex}%.`;
  } else if (purchasingPowerIndex >= 100) {
    recommendation = "Sehr vorteilhaftes Angebot mit überdurchschnittlicher Kaufkraft.";
  } else {
    recommendation = "Solides Angebot im Rahmen des regionalen Preisniveaus.";
  }

  return {
    nominalSalary: nominalSalaryAnnual,
    currency,
    salaryInEur,
    purchasingPowerAdjustedEur,
    estimatedNetAnnualEur,
    estimatedNetMonthlyEur,
    purchasingPowerIndex,
    recommendation,
  };
}
