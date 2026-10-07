// -----------------------------------------------------------------------------
// EU-Entgelttransparenz-Indikator (Richtlinie 2026)
// -----------------------------------------------------------------------------
// Prüft, ob ein Stellenangebot ein transparentes Gehaltsband enthält und
// liefert bei Fehlen einen Benchmark-Schätzwert für NRW / Remote.
// -----------------------------------------------------------------------------

export interface SalaryTransparencyResult {
  hasTransparentSalary: boolean;
  salaryText: string | null;
  badgeLabel: string;
  badgeColor: string; // Tailwind styling
  benchmarkRangeText: string;
  transparencyNotice: string;
}

/**
 * Prüft, ob Text oder salaryInfo ein Gehalt angibt.
 */
export function checkSalaryTransparency(
  salaryInfo?: string | null,
  description?: string | null,
  role: string = "Frontend"
): SalaryTransparencyResult {
  const combined = `${salaryInfo || ""} ${description || ""} ${role}`.toLowerCase();

  // Regex für typische Gehaltsangaben (z. B. "55.000 €", "50k-65k", "EUR 4.500 / Monat", "Gehalt: ab 45.000")
  const hasSalaryRegex =
    /(\d{2,3}[\.,]\d{3}\s*(€|eur)|(\d{2,3}\s*k\s*(€|eur)?)|gehalt[:\s]+(\d{2,3})|vergütung[:\s]+(\d{2,3})|\b\d{4,6}\s*€)/i.test(
      combined
    );

  const hasSalary = Boolean(salaryInfo && salaryInfo.trim().length > 0) || hasSalaryRegex;

  // Regionaler Richtwert für NRW (Fachinformatiker / Frontend)
  const isSenior = combined.includes("senior") || combined.includes("lead");
  const benchmarkMin = isSenior ? 62000 : 48000;
  const benchmarkMax = isSenior ? 78000 : 58000;
  const benchmarkRangeText = `${benchmarkMin.toLocaleString("de-DE")} € – ${benchmarkMax.toLocaleString("de-DE")} € (NRW / Remote Richtwert)`;

  if (hasSalary) {
    const text = salaryInfo || "Gehaltsangabe in Beschreibung enthalten";
    return {
      hasTransparentSalary: true,
      salaryText: text,
      badgeLabel: "✅ EU-Transparenz: Gehalt angegeben",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      benchmarkRangeText,
      transparencyNotice: "Dieses Angebot erfüllt die Vorgaben der EU-Entgelttransparenzrichtlinie für transparente Vergütungsbänder.",
    };
  }

  return {
    hasTransparentSalary: false,
    salaryText: null,
    badgeLabel: "⚠️ Kein Gehaltsband (EU-Transparenz)",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    benchmarkRangeText,
    transparencyNotice: `Kein Gehaltsband angegeben. Markt-Benchmark für diesen Tech-Stack in NRW: ca. ${benchmarkRangeText}. Empfehlung: Im Erstgespräch direkt nach dem Budget fragen.`,
  };
}
