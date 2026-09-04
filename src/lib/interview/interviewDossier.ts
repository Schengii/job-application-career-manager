// -----------------------------------------------------------------------------
// Interview-Dossier & Cheat-Sheet Generator
// -----------------------------------------------------------------------------
// Erzeugt ein strukturiertes, 1- bis 2-seitiges DIN A4 Vorbereitungs-Dossier
// (HTML / PDF-Druckansicht) für anstehende Vorstellungsgespräche.
// -----------------------------------------------------------------------------
import type { ApplicationDetail, PreferencesWithProfile } from "@/types";
import { formatDate } from "@/lib/core/utils";
import { INTERVIEW_QUESTIONS } from "@/lib/interview/interviewGuide";

export type DossierOptions = {
  includeEmployerQuestions?: boolean;
  includeSalaryLevers?: boolean;
  includeChecklist?: boolean;
};

export function generateInterviewDossierHtml(
  application: ApplicationDetail,
  preferences?: PreferencesWithProfile | null,
  options: DossierOptions = {
    includeEmployerQuestions: true,
    includeSalaryLevers: true,
    includeChecklist: true,
  }
): string {
  const company = application.company;
  const job = application.jobPosting;
  const questionsForEmployer = INTERVIEW_QUESTIONS.filter(
    (q) => q.category === "QUESTIONS_FOR_EMPLOYER"
  ).slice(0, 4);

  const techStackList = (job?.techStack || preferences?.techStack || "TypeScript, React, Next.js, CSS, HTML")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const formattedAppDate = formatDate(application.applicationDate);
  const formattedNextStepDate = formatDate(application.nextStepDate);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Interview-Dossier – ${escapeHtml(company.name)} (${escapeHtml(application.position)})</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 16mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 11pt;
    }
    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .badge {
      display: inline-block;
      background: #eef2ff;
      color: #4338ca;
      font-size: 8.5pt;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    .subtitle {
      font-size: 10.5pt;
      color: #475569;
      font-weight: 600;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .card-title {
      font-size: 9.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #334155;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      margin-bottom: 3px;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
      max-width: 60%;
      word-break: break-word;
    }
    .tag {
      display: inline-block;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
      font-size: 8pt;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #1e293b;
      margin: 12px 0 6px 0;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 3px;
    }
    .checklist {
      list-style: none;
    }
    .checklist li {
      font-size: 8.5pt;
      margin-bottom: 4px;
      padding-left: 18px;
      position: relative;
    }
    .checklist li::before {
      content: "☐";
      position: absolute;
      left: 0;
      top: -1px;
      font-size: 10pt;
      color: #4f46e5;
    }
    .notes-box {
      font-size: 8.5pt;
      color: #1e293b;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      white-space: pre-wrap;
      max-height: 120px;
      overflow: hidden;
    }
    .question-item {
      font-size: 8.5pt;
      margin-bottom: 6px;
      padding-left: 10px;
      border-left: 2px solid #4f46e5;
    }
    .question-title {
      font-weight: 700;
      color: #0f172a;
    }
    .question-hint {
      color: #64748b;
      font-size: 7.5pt;
    }
    .footer {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #94a3b8;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">Interview-Dossier & Leitfaden</span>
      <h1>${escapeHtml(application.position)}</h1>
      <p class="subtitle">bei ${escapeHtml(company.name)}${company.city ? ` · ${escapeHtml(company.city)}` : ""}</p>
    </div>
    <div style="text-align: right;">
      <p style="font-size: 8.5pt; color: #64748b;">Kandidat: <strong>${escapeHtml(preferences?.fullName || "Bewerber")}</strong></p>
      <p style="font-size: 8.5pt; color: #64748b;">Stand: ${new Date().toLocaleDateString("de-DE")}</p>
    </div>
  </div>

  <div class="grid">
    <!-- Box 1: Unternehmens- & Kontaktdaten -->
    <div class="card">
      <div class="card-title">🏢 Unternehmens- & Kontaktdaten</div>
      <div class="info-row">
        <span class="info-label">Ansprechpartner:</span>
        <span class="info-value">${escapeHtml(company.contactName || "Nicht angegeben")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">E-Mail:</span>
        <span class="info-value">${escapeHtml(company.contactEmail || "—")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Telefon:</span>
        <span class="info-value">${escapeHtml(company.contactPhone || "—")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Adresse / Ort:</span>
        <span class="info-value">${escapeHtml([company.street, company.postalCode, company.city].filter(Boolean).join(", ") || "—")}</span>
      </div>
      ${application.meetingUrl ? `
      <div class="info-row" style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
        <span class="info-label" style="color: #4f46e5;">Meeting-Einwahl:</span>
        <span class="info-value" style="color: #4f46e5;">${escapeHtml(application.meetingUrl)}</span>
      </div>` : ""}
    </div>

    <!-- Box 2: Bewerbungs-Status & Eckdaten -->
    <div class="card">
      <div class="card-title">📌 Bewerbungs-Eckdaten</div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value">${escapeHtml(application.status)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Bewerbungsdatum:</span>
        <span class="info-value">${escapeHtml(formattedAppDate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Nächster Termin:</span>
        <span class="info-value" style="color: #4338ca;">${escapeHtml(formattedNextStepDate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Schritt / Thema:</span>
        <span class="info-value">${escapeHtml(application.nextStep || "Vorstellungsgespräch")}</span>
      </div>
      ${job?.salaryInfo ? `
      <div class="info-row">
        <span class="info-label">Gehaltsangabe Stelle:</span>
        <span class="info-value">${escapeHtml(job.salaryInfo)}</span>
      </div>` : ""}
    </div>
  </div>

  <!-- Tech-Stack & Profil-Abgleich -->
  <div class="card" style="margin-bottom: 12px;">
    <div class="card-title">💻 Geforderter Tech-Stack & Kernkompetenzen</div>
    <div>
      ${techStackList.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
    </div>
    ${job?.description ? `
    <p style="font-size: 8pt; color: #64748b; margin-top: 6px; line-height: 1.35;">
      <strong>Fokus laut Ausschreibung:</strong> ${escapeHtml(job.description.slice(0, 220))}${job.description.length > 220 ? "…" : ""}
    </p>` : ""}
  </div>

  <div class="grid">
    <!-- Vorbereitungsnotizen -->
    <div class="card">
      <div class="card-title">📝 Eigene Notizen & Vorbereitung</div>
      ${application.notes ? `
      <div class="notes-box">${escapeHtml(application.notes)}</div>
      ` : `
      <p style="font-size: 8pt; color: #94a3b8; font-style: italic;">Noch keine Vorbereitungsnotizen erfasst.</p>
      `}
    </div>

    <!-- Vorbereitungs-Checkliste -->
    ${options.includeChecklist ? `
    <div class="card">
      <div class="card-title">✅ Interview-Checkliste</div>
      <ul class="checklist">
        <li>Technischer Werdegang (Elektroniker $\\rightarrow$ Fachinformatiker) prägnant vorbereitet</li>
        <li>Praxisprojekt <em>electroCheck-ai</em> (React, TS, Tailwind, Zod) demonstrierbar</li>
        <li>Arbeitsweise (Git Flow, Clean Code, Testing mit Vitest) veranschaulicht</li>
        <li>Gehaltsvorstellung & Verhandlungsspanne definiert</li>
        <li>Ruhige Umgebung & Kamera/Headset getestet</li>
      </ul>
    </div>
    ` : ""}
  </div>

  ${options.includeEmployerQuestions ? `
  <div class="card" style="margin-bottom: 12px;">
    <div class="card-title">❓ Empfohlene Gegenfragen an den Arbeitgeber</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      ${questionsForEmployer.map((q) => `
        <div class="question-item">
          <p class="question-title">${escapeHtml(q.question)}</p>
          <p class="question-hint">${escapeHtml(q.answerSummary.slice(0, 110))}…</p>
        </div>
      `).join("")}
    </div>
  </div>
  ` : ""}

  ${options.includeSalaryLevers ? `
  <div class="card">
    <div class="card-title">💰 Gehalts- & Verhandlungsargumente (Marktvergleich)</div>
    <div style="font-size: 8pt; color: #334155; line-height: 1.35;">
      <strong>Marktspanne FIAE Frontend:</strong> 42.000 € – 52.000 € (Junior/Mid NRW). 
      <strong>Kernargumente:</strong> Fundierte praktische Vorbildung (Industrie/Elektrotechnik), TypeScript/React-Expertise, praxisnahe Projekte (electroCheck-ai), hohe Eigenmotivation und rasche Einarbeitungszeit.
    </div>
  </div>
  ` : ""}

  <div class="footer">
    <span>Job Application & Career Manager · Vertrauliches Vorbereitungsdokument</span>
    <span>Gedruckt am ${new Date().toLocaleString("de-DE")}</span>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
