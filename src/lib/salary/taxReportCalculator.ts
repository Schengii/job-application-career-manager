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

export function generateTaxReportPrintHtml(report: TaxYearReport, applicantName: string = "Alexander Schepp"): string {
  const categoryLabels: Record<string, string> = {
    TRAVEL: "Fahrtkosten Vorstellungsgespräch (0,30 €/km)",
    APPLICATION_FEE: "Bewerbungspauschale",
    EQUIPMENT: "Arbeitsmittel / Literatur / Fotos",
    CERTIFICATION: "Zertifikat / Fachfortbildung",
  };

  const rows = report.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${new Date(item.date).toLocaleDateString("de-DE")}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${categoryLabels[item.category] || item.category}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <strong>${item.companyName ? `${item.companyName} – ` : ""}</strong>${item.description}
      </td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right;">${item.distanceKm ? `${item.distanceKm} km` : "—"}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: bold;">${item.amount.toFixed(2).replace(".", ",")} €</td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Bewerbungskosten Steuerjahr ${report.year} - ${applicantName}</title>
  <style>
    @page { size: A4; margin: 15mm 20mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.4; font-size: 12px; margin: 0; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 4px; color: #1e293b; }
    .meta { font-size: 11px; color: #64748b; margin-bottom: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
    .summary-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; }
    .summary-grid { display: flex; justify-content: space-between; gap: 12px; }
    .summary-item { text-align: center; }
    .summary-val { font-size: 16px; font-weight: bold; color: #0f172a; }
    .summary-lbl { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
    .total-highlight { color: #2563eb; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { text-align: left; padding: 8px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
    .signature-area { margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <h1>Aufstellung der Bewerbungskosten (Werbungskosten § 9 EStG)</h1>
  <div class="meta">
    Steuerpflichtiger: <strong>${applicantName}</strong> &nbsp;·&nbsp; Steuerjahr: <strong>${report.year}</strong> &nbsp;·&nbsp; Erstellt am: ${new Date().toLocaleDateString("de-DE")} &nbsp;·&nbsp; Anlage N
  </div>

  <div class="summary-box">
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-val">${report.totalTravelCost.toFixed(2).replace(".", ",")} €</div>
        <div class="summary-lbl">Fahrtkosten (${report.interviewTripsCount} Interviews)</div>
      </div>
      <div class="summary-item">
        <div class="summary-val">${report.totalApplicationFees.toFixed(2).replace(".", ",")} €</div>
        <div class="summary-lbl">Bewerbungspauschalen</div>
      </div>
      <div class="summary-item">
        <div class="summary-val">${report.totalOtherCost.toFixed(2).replace(".", ",")} €</div>
        <div class="summary-lbl">Arbeitsmittel / Weiterbildung</div>
      </div>
      <div class="summary-item">
        <div class="summary-val total-highlight">${report.totalDeductible.toFixed(2).replace(".", ",")} €</div>
        <div class="summary-lbl font-bold" style="color: #2563eb;">Gesamtabzug § 9 EStG</div>
      </div>
    </div>
  </div>

  <h3 style="font-size: 13px; margin-bottom: 4px;">Einzelnachweis aller Aufwendungen</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Datum</th>
        <th style="width: 28%;">Kategorie</th>
        <th style="width: 40%;">Unternehmen / Verwendungszweck</th>
        <th style="width: 10%; text-align: right;">Distanz</th>
        <th style="width: 10%; text-align: right;">Betrag</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="signature-area">
    <div>Ort, Datum: ____________________________________</div>
    <div>Unterschrift: ____________________________________</div>
  </div>
</body>
</html>`.trim();
}
