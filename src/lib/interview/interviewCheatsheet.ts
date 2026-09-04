// -----------------------------------------------------------------------------
// Interview Cheatsheet & Vorbereitungs-Spickzettel Generator (Druckfertiges HTML)
// -----------------------------------------------------------------------------
import type { InterviewQuestion } from "@/lib/interview/interviewGuide";

export type CheatsheetOptions = {
  candidateName?: string | null;
  targetRole?: string | null;
  companyName?: string | null;
  position?: string | null;
  questions: InterviewQuestion[];
  personalNotes?: Record<string, string>; // questionId -> personal note
  pitchNotes?: string | null;
  counterQuestions?: string[];
};

export function generateInterviewCheatsheetHtml(options: CheatsheetOptions): string {
  const companyTitle = options.companyName
    ? `${options.position || "Frontend Entwickler"} bei ${options.companyName}`
    : options.targetRole || "Fachinformatiker für Anwendungsentwicklung";

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Interview-Vorbereitungsspickzettel - ${escapeHtml(companyTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.4; background: #fff; padding: 10px; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 18px; font-weight: 800; color: #0f172a; }
    .sub { font-size: 12px; color: #4f46e5; font-weight: 600; }
    .meta { font-size: 10px; color: #64748b; text-align: right; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; background: #f8fafc; }
    .box-title { font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: #4338ca; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
    .q-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 8px; page-break-inside: avoid; }
    .q-title { font-size: 11.5px; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
    .q-cat { font-size: 9px; font-weight: 600; text-transform: uppercase; color: #6366f1; background: #eef2ff; padding: 1px 4px; border-radius: 3px; display: inline-block; margin-bottom: 3px; }
    .q-guide { font-size: 10.5px; color: #475569; margin-bottom: 4px; line-height: 1.35; }
    .q-personal { font-size: 10.5px; color: #0f172a; background: #ecfdf5; border-left: 3px solid #10b981; padding: 4px 6px; border-radius: 2px; margin-top: 4px; font-style: italic; }
    .footer { margin-top: 14px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Interview-Vorbereitungs-Spickzettel</div>
      <div class="sub">${escapeHtml(companyTitle)}</div>
    </div>
    <div class="meta">
      <div><strong>Kandidat:</strong> ${escapeHtml(options.candidateName || "Max Mustermann")}</div>
      <div><strong>Datum:</strong> ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date())}</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="box">
      <div class="box-title">🎯 2-Minuten Pitch / Werdegang-Fokus</div>
      <p style="color: #334155; font-size: 10px;">
        1. <strong>Umschulung zum Fachinformatiker AE (2026):</strong> Solide Basis in moderner Frontend-Architektur.<br/>
        2. <strong>Abschlussprojekt „electroCheck-ai“:</strong> Mobile-First PWA mit React, TypeScript & REST API.<br/>
        3. <strong>Vorerfahrung:</strong> Gelernter Elektroniker für Betriebstechnik ➔ Schnelle Problemlösungskompetenz.
      </p>
    </div>

    <div class="box">
      <div class="box-title">❓ Eigene Gegenfragen an das Team</div>
      <ul style="padding-left: 14px; color: #334155; font-size: 10px;">
        <li>Wie sieht der typische Sprint- und Review-Zyklus im Frontend-Team aus?</li>
        <li>Welche Test-Strategie (Unit, E2E) wird aktuell verfolgt?</li>
        <li>Wie gestaltet sich die Einarbeitung in den ersten 90 Tagen?</li>
      </ul>
    </div>
  </div>

  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4338ca; margin-bottom: 6px; letter-spacing: 0.5px;">
    Vorbereitete Fach- & Verhaltensfragen (${options.questions.length})
  </div>

  ${options.questions
    .map((q) => {
      const personalNote = options.personalNotes?.[q.id];
      return `
    <div class="q-card">
      <span class="q-cat">${escapeHtml(q.categoryLabel)}</span>
      <div class="q-title">${escapeHtml(q.question)}</div>
      <div class="q-guide"><strong>Leitfaden:</strong> ${escapeHtml(q.answerSummary)}</div>
      ${personalNote ? `<div class="q-personal"><strong>Meine Formulierung:</strong> ${escapeHtml(personalNote)}</div>` : ""}
    </div>
  `;
    })
    .join("")}

  <div class="footer">
    Job Application & Career Manager • Vertrauliches Vorbereitungsdokument
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
