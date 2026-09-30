// -----------------------------------------------------------------------------
// Steuerbericht- & Bewerbungskosten-Rechner (Einkommensteuererklärung)
// -----------------------------------------------------------------------------
// Ermöglicht das Festhalten und Berechnen aller steuerlich absetzbaren
// Werbungskosten im Rahmen der Jobsuche:
// - Kilometerpauschale für Vorstellungsgespräche (0,30 € / km)
// - Pauschale pro schriftlicher / Online-Bewerbung (z. B. 2,50 € bzw. 8,50 €)
// - Anschaffungen für Bewerbungen (Fachliteratur, Hard-/Software, Bewerbungsfotos)
// -----------------------------------------------------------------------------

export interface TaxDeductibleItem {
  id: string;
  category: "TRAVEL" | "APPLICATION_FEE" | "EQUIPMENT" | "CERTIFICATION";
  date: string;
  description: string;
  companyName?: string;
  amount: number; // in Euro
  distanceKm?: number; // für Fahrten
  receiptUrl?: string;
}

export interface TaxYearReport {
  year: number;
  items: TaxDeductibleItem[];
  totalDeductible: number;
  totalTravelCost: number;
  totalApplicationFees: number;
  totalOtherCost: number;
  interviewTripsCount: number;
}

const KM_RATE = 0.30; // 0,30 € pro gefahrenem Kilometer (Hin- und Rückfahrt)

export function calculateTravelCost(roundTripKm: number): number {
  if (roundTripKm <= 0) return 0;
  return Math.round(roundTripKm * KM_RATE * 100) / 100;
}

export function generateTaxReport(year: number, items: TaxDeductibleItem[]): TaxYearReport {
  const filtered = items.filter((item) => {
    const d = new Date(item.date);
    return !isNaN(d.getTime()) && d.getFullYear() === year;
  });

  let totalTravelCost = 0;
  let totalApplicationFees = 0;
  let totalOtherCost = 0;
  let interviewTripsCount = 0;

  for (const item of filtered) {
    if (item.category === "TRAVEL") {
      totalTravelCost += item.amount;
      interviewTripsCount += 1;
    } else if (item.category === "APPLICATION_FEE") {
      totalApplicationFees += item.amount;
    } else {
      totalOtherCost += item.amount;
    }
  }

  const totalDeductible = Math.round((totalTravelCost + totalApplicationFees + totalOtherCost) * 100) / 100;

  return {
    year,
    items: filtered,
    totalDeductible,
    totalTravelCost: Math.round(totalTravelCost * 100) / 100,
    totalApplicationFees: Math.round(totalApplicationFees * 100) / 100,
    totalOtherCost: Math.round(totalOtherCost * 100) / 100,
    interviewTripsCount,
  };
}

export function generateTaxCsvExport(report: TaxYearReport): string {
  const headers = ["Datum", "Kategorie", "Unternehmen / Verwendungszweck", "Distanz (km)", "Absetzbarer Betrag (EUR)"];
  const rows = report.items.map((i) => [
    i.date,
    i.category === "TRAVEL"
      ? "Fahrtkosten Vorstellungsgespräch"
      : i.category === "APPLICATION_FEE"
      ? "Bewerbungspauschale"
      : i.category === "CERTIFICATION"
      ? "Zertifikat / Weiterbildung"
      : "Arbeitsmittel / Fotos",
    `"${(i.companyName ? `${i.companyName}: ` : "") + i.description.replace(/"/g, '""')}"`,
    i.distanceKm ? String(i.distanceKm) : "-",
    i.amount.toFixed(2).replace(".", ","),
  ]);

  const summaryRows = [
    [],
    ["GESAMTÜBERSICHT WERBUNGSKOSTEN", "", "", "", ""],
    ["Fahrtkosten zu Interviews", "", "", "", report.totalTravelCost.toFixed(2).replace(".", ",")],
    ["Bewerbungspauschalen", "", "", "", report.totalApplicationFees.toFixed(2).replace(".", ",")],
    ["Sonstige Aufwendungen", "", "", "", report.totalOtherCost.toFixed(2).replace(".", ",")],
    ["STEUERLICH ABSETZBARER GESAMTBETRAG", "", "", "", report.totalDeductible.toFixed(2).replace(".", ",")],
  ];

  return [headers.join(";"), ...rows.map((r) => r.join(";")), ...summaryRows.map((r) => r.join(";"))].join("\n");
}
