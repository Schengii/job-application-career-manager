// -----------------------------------------------------------------------------
// Vermittlungsbudget- & Kostenerstattungs-Rechner (§ 44 SGB III)
// -----------------------------------------------------------------------------
// Ermittelt erstattungsfähige Pauschalen für Bewerbungskosten (z. B. 5,00 € bzw.
// 2,50 € pro Bewerbung) und Fahrtkosten zu Vorstellungsgesprächen und erstellt
// einen druckfertigen Erstattungsantrag für die Agentur für Arbeit / das Jobcenter.
// -----------------------------------------------------------------------------
import type { ApplicationListItem } from "@/types";
import { formatDate } from "@/lib/core/utils";

export type BudgetSettings = {
  ratePerApplication: number; // Standard: 5.00 €
  ratePerOnlineApplication?: number; // z.B. 2.50 € oder ebenfalls 5.00 €
  maxAnnualBudget: number; // Üblicherweise 260 € bis 300 € pro Jahr
};

export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
  ratePerApplication: 5.0,
  ratePerOnlineApplication: 5.0,
  maxAnnualBudget: 260.0,
};

export type BudgetCalculationResult = {
  totalApplicationsCount: number;
  totalApplicationReimbursement: number;
  interviewsCount: number;
  estimatedTravelCosts: number;
  totalReimbursement: number;
  remainingAnnualBudget: number;
  items: {
    id: string;
    date: string;
    company: string;
    position: string;
    type: string;
    amount: number;
  }[];
};

export function calculateVermittlungsbudget(
  applications: ApplicationListItem[],
  settings: BudgetSettings = DEFAULT_BUDGET_SETTINGS
): BudgetCalculationResult {
  const eligibleApps = applications.filter((a) => a.applicationDate && a.status !== "DRAFT");

  const items = eligibleApps.map((app) => {
    const isOnline = Boolean(app.source || app.jobPosting?.portalSource);
    const amount = isOnline && settings.ratePerOnlineApplication !== undefined
      ? settings.ratePerOnlineApplication
      : settings.ratePerApplication;

    return {
      id: app.id,
      date: formatDate(app.applicationDate),
      company: app.company.name,
      position: app.position,
      type: isOnline ? "Online-Bewerbung" : "Schriftliche Bewerbung",
      amount,
    };
  });

  const totalApplicationReimbursement = items.reduce((acc, item) => acc + item.amount, 0);

  // Vorstellungsgespräche zählen
  const interviewsCount = applications.filter(
    (a) => a.status === "INTERVIEW" || a.interviewStage !== null
  ).length;

  // Schätzung Reisekosten (z.B. Pauschale von 15 € je Vor-Ort-Gespräch, falls vorhanden)
  const estimatedTravelCosts = 0; // Wird separat bei konkreter Erfassung addiert

  const totalReimbursement = Math.min(
    totalApplicationReimbursement + estimatedTravelCosts,
    settings.maxAnnualBudget
  );

  const remainingAnnualBudget = Math.max(0, settings.maxAnnualBudget - totalReimbursement);

  return {
    totalApplicationsCount: eligibleApps.length,
    totalApplicationReimbursement,
    interviewsCount,
    estimatedTravelCosts,
    totalReimbursement,
    remainingAnnualBudget,
    items,
  };
}

export function generateReimbursementApplicationHtml(options: {
  candidateName: string;
  candidateAddress?: string | null;
  candidateEmail?: string | null;
  candidatePhone?: string | null;
  customerId?: string | null;
  calculation: BudgetCalculationResult;
}): string {
  const {
    candidateName,
    candidateAddress = "",
    candidateEmail = "",
    candidatePhone = "",
    customerId = "",
    calculation,
  } = options;

  const rows = calculation.items.map((item, idx) => `
    <tr>
      <td style="text-align: center; width: 30px;">${idx + 1}</td>
      <td style="width: 85px;">${escapeHtml(item.date)}</td>
      <td><strong>${escapeHtml(item.company)}</strong></td>
      <td>${escapeHtml(item.position)}</td>
      <td>${escapeHtml(item.type)}</td>
      <td style="text-align: right; font-weight: bold; width: 80px;">${item.amount.toFixed(2)} €</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Antrag auf Erstattung von Bewerbungskosten (§ 44 SGB III) – ${escapeHtml(candidateName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 15mm 18mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #111;
      margin: 0;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 16pt;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 9.5pt;
      color: #475569;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 9pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 6px 8px;
      font-size: 8.5pt;
      border-bottom: 2px solid #94a3b8;
      text-transform: uppercase;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 9pt;
    }
    .total-box {
      text-align: right;
      font-size: 11pt;
      font-weight: bold;
      padding: 10px 12px;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .signature-section {
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      gap: 50px;
    }
    .signature-line {
      flex: 1;
      border-top: 1px solid #334155;
      padding-top: 4px;
      font-size: 8.5pt;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Antrag auf Erstattung von Bewerbungskosten</div>
    <div class="subtitle">Förderung aus dem Vermittlungsbudget gemäß § 44 Drittes Buch Sozialgesetzbuch (SGB III)</div>
  </div>

  <div class="meta-grid">
    <div>
      <strong>Antragsteller/in:</strong> ${escapeHtml(candidateName)}<br>
      ${candidateAddress ? `${escapeHtml(candidateAddress)}<br>` : ""}
      ${candidateEmail || candidatePhone ? `${[candidatePhone, candidateEmail].filter((x): x is string => Boolean(x)).map(escapeHtml).join(" · ")}` : ""}
    </div>
    <div style="text-align: right;">
      ${customerId ? `<strong>Kundennummer / BG-Nr.:</strong> ${escapeHtml(customerId)}<br>` : ""}
      <strong>Erfasste Bewerbungen:</strong> ${calculation.totalApplicationsCount}<br>
      <strong>Beantragter Gesamtbetrag:</strong> ${calculation.totalReimbursement.toFixed(2)} €
    </div>
  </div>

  <p style="font-size: 9pt; color: #334155; margin-bottom: 12px;">
    Hiermit beantrage ich die Erstattung von Bewerbungskosten für folgende nachweislich durchgeführte Bewerbungen:
  </p>

  <table>
    <thead>
      <tr>
        <th style="text-align: center;">Nr.</th>
        <th>Datum</th>
        <th>Unternehmen</th>
        <th>Position</th>
        <th>Bewerbungsart</th>
        <th style="text-align: right;">Betrag</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="total-box">
    Beantragter Erstattungsbetrag: ${calculation.totalReimbursement.toFixed(2)} €
  </div>

  <p style="font-size: 8.5pt; color: #475569; line-height: 1.4;">
    Ich versichere die Richtigkeit der gemachten Angaben und bestätige, dass die oben aufgeführten Aufwendungen tatsächlich im Rahmen meiner beruflichen Eingliederungsbemühungen entstanden sind.
  </p>

  <div class="signature-section">
    <div class="signature-line">
      Ort, Datum
    </div>
    <div class="signature-line" style="text-align: right;">
      Unterschrift ${escapeHtml(candidateName)}
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
