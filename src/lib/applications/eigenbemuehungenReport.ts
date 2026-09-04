// -----------------------------------------------------------------------------
// Offizieller Nachweis der Eigenbemühungen (gem. § 38 Abs. 2 / § 159 SGB III)
// -----------------------------------------------------------------------------
// Generiert ein druckoptimiertes DIN A4 Querformat-Dokument, das exakt den
// Anforderungen der Bundesagentur für Arbeit und der Jobcenter für den monatlichen
// Nachweis der Bewerbungsaktivitäten entspricht.
// -----------------------------------------------------------------------------
import type { ApplicationListItem } from "@/types";
import { formatDate } from "@/lib/core/utils";
import { findStatusMeta, APPLICATION_STATUSES } from "@/lib/core/constants";

export type EigenbemuehungenOptions = {
  candidateName?: string | null;
  candidateAddress?: string | null;
  candidateEmail?: string | null;
  candidatePhone?: string | null;
  customerId?: string | null; // Kundennummer oder BG-Nummer bei der Agentur für Arbeit
  periodLabel: string; // z.B. "August 2026" oder "01.08.2026 – 31.08.2026"
  applications: ApplicationListItem[];
};

export function filterApplicationsByPeriod(
  applications: ApplicationListItem[],
  startDate: Date,
  endDate: Date
): ApplicationListItem[] {
  return applications.filter((app) => {
    if (!app.applicationDate) return false;
    const d = new Date(app.applicationDate);
    return d >= startDate && d <= endDate;
  });
}

export function generateEigenbemuehungenHtml(options: EigenbemuehungenOptions): string {
  const {
    candidateName = "Bewerber/in",
    candidateAddress = "",
    candidateEmail = "",
    candidatePhone = "",
    customerId = "",
    periodLabel,
    applications,
  } = options;

  const totalCount = applications.length;
  const interviewCount = applications.filter((a) => a.status === "INTERVIEW").length;
  const rejectedCount = applications.filter((a) => a.status === "REJECTED").length;
  const offerCount = applications.filter((a) => a.status === "OFFER").length;
  const openCount = applications.filter((a) => a.status === "SENT" || a.status === "DRAFT").length;

  const rows = applications.map((app, index) => {
    const statusMeta = findStatusMeta(APPLICATION_STATUSES, app.status);
    const sourceLabel = app.source || app.jobPosting?.portalSource || "Online-Bewerbung";
    const companyLocation = [app.company.postalCode, app.company.city].filter(Boolean).join(" ");

    let ergebnis = statusMeta?.label ?? app.status;
    if (app.status === "INTERVIEW") {
      ergebnis = app.nextStepDate
        ? `Vorstellungsgespräch (${formatDate(app.nextStepDate)})`
        : "Einladung zum Vorstellungsgespräch";
    } else if (app.status === "REJECTED") {
      ergebnis = app.rejectionReason ? `Absage (${app.rejectionReason})` : "Absage erhalten";
    } else if (app.status === "OFFER") {
      ergebnis = "Vertragsangebot erhalten";
    } else if (app.status === "SENT") {
      ergebnis = "Bewerbung eingereicht (Rückmeldung ausstehend)";
    }

    return `
      <tr>
        <td style="text-align: center; font-weight: bold; width: 32px;">${index + 1}</td>
        <td style="white-space: nowrap; width: 90px;">${formatDate(app.applicationDate)}</td>
        <td>
          <strong>${escapeHtml(app.company.name)}</strong>
          ${companyLocation ? `<div style="font-size: 8.5pt; color: #555;">${escapeHtml(companyLocation)}</div>` : ""}
          ${app.company.contactName ? `<div style="font-size: 8pt; color: #777;">z. Hd. ${escapeHtml(app.company.contactName)}</div>` : ""}
        </td>
        <td>
          <strong>${escapeHtml(app.position)}</strong>
        </td>
        <td style="font-size: 9pt;">${escapeHtml(sourceLabel)}</td>
        <td>
          <span class="status-badge status-${app.status.toLowerCase()}">${escapeHtml(ergebnis)}</span>
          ${app.nextStep && app.status !== "REJECTED" ? `<div style="font-size: 8pt; color: #666; margin-top: 2px;">${escapeHtml(app.nextStep)}</div>` : ""}
        </td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Nachweis von Eigenbemühungen – ${escapeHtml(candidateName)} – ${escapeHtml(periodLabel)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 14mm 12mm 14mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.35;
      color: #111;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
    }
    .header-table td {
      vertical-align: top;
    }
    .doc-title {
      font-size: 15pt;
      font-weight: bold;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 3px 0;
    }
    .doc-subtitle {
      font-size: 9pt;
      color: #475569;
    }
    .candidate-info {
      text-align: right;
      font-size: 9pt;
      color: #334155;
    }
    .candidate-name {
      font-size: 11pt;
      font-weight: bold;
      color: #0f172a;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      background: #f1f5f9;
      padding: 6px 10px;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 8.5pt;
      border: 1px solid #cbd5e1;
    }
    .meta-bar strong {
      color: #0f172a;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    table.data-table th {
      background: #f8fafc;
      color: #334155;
      font-size: 8.5pt;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    table.data-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      font-size: 9pt;
    }
    table.data-table tr:nth-child(even) td {
      background-color: #fafbfc;
    }
    .status-badge {
      font-weight: 600;
    }
    .status-interview { color: #0284c7; }
    .status-offer { color: #16a34a; }
    .status-rejected { color: #dc2626; }
    .status-sent { color: #d97706; }
    .status-draft { color: #64748b; }

    .summary-box {
      margin-top: 8px;
      font-size: 8.5pt;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      border-radius: 4px;
      display: inline-block;
    }
    .declaration {
      margin-top: 14px;
      font-size: 8pt;
      color: #475569;
      line-height: 1.4;
    }
    .signature-row {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      gap: 40px;
    }
    .signature-field {
      flex: 1;
      border-top: 1px solid #334155;
      padding-top: 4px;
      font-size: 8.5pt;
      color: #475569;
    }
  </style>
</head>
<body>

  <table class="header-table">
    <tr>
      <td>
        <div class="doc-title">Nachweis von Eigenbemühungen</div>
        <div class="doc-subtitle">gemäß § 38 Abs. 2 / § 159 SGB III zur Vorlage bei der Agentur für Arbeit / beim Jobcenter</div>
      </td>
      <td class="candidate-info">
        <div class="candidate-name">${escapeHtml(candidateName)}</div>
        ${candidateAddress ? `<div>${escapeHtml(candidateAddress)}</div>` : ""}
        ${candidateEmail || candidatePhone ? `<div>${[candidatePhone, candidateEmail].filter((x): x is string => Boolean(x)).map(escapeHtml).join(" · ")}</div>` : ""}
        ${customerId ? `<div style="font-weight: bold; color: #0284c7; margin-top: 2px;">Kundennummer / BG-Nr.: ${escapeHtml(customerId)}</div>` : ""}
      </td>
    </tr>
  </table>

  <div class="meta-bar">
    <div><strong>Berichtszeitraum:</strong> ${escapeHtml(periodLabel)}</div>
    <div><strong>Bewerbungen gesamt:</strong> ${totalCount}</div>
    <div><strong>Vorstellungsgespräche:</strong> ${interviewCount}</div>
    <div><strong>Vertragsangebote:</strong> ${offerCount}</div>
    <div><strong>Offen / Rückmeldung ausstehend:</strong> ${openCount}</div>
    <div><strong>Absagen:</strong> ${rejectedCount}</div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="text-align: center;">Nr.</th>
        <th>Bewerbung am</th>
        <th>Arbeitgeber (Firma & Anschrift)</th>
        <th>Angestrebte Stelle / Tätigkeit</th>
        <th>Art der Bewerbung</th>
        <th>Ergebnis / Aktueller Stand</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length > 0 ? rows : `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #64748b;">Im ausgewählten Zeitraum wurden keine Bewerbungen erfasst.</td></tr>`}
    </tbody>
  </table>

  <div class="declaration">
    Ich versichere hiermit die Richtigkeit und Vollständigkeit der vorstehend aufgeführten Bewerbungsaktivitäten und Eigenbemühungen um einen Arbeitsplatz.
  </div>

  <div class="signature-row">
    <div class="signature-field">
      Ort, Datum
    </div>
    <div class="signature-field" style="text-align: right;">
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
