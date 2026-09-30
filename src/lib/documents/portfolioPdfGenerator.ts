// -----------------------------------------------------------------------------
// Praxis-Projektportfolio Generator (DIN A4 PDF & Druckansicht)
// -----------------------------------------------------------------------------
// Erzeugt ein ansprechendes Entwickler-Projektportfolio mit Screenshots,
// Architektur-Highlights, Tech-Stack-Badges und Live-/GitHub-Links.
// -----------------------------------------------------------------------------
import type { PreferencesWithProfile } from "@/types";

export function generateProjectPortfolioHtml(preferences: PreferencesWithProfile): string {
  const projects = preferences.projectEntries || [];

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Praxis-Projektportfolio - ${escapeHtml(preferences.fullName || "Entwickler")}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #fff; line-height: 1.5; font-size: 11.5px; }
    header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { font-size: 22px; color: #0f172a; font-weight: 700; }
    .subtitle { color: #3b82f6; font-size: 13px; font-weight: 600; margin-top: 2px; }
    .contact { font-size: 11px; color: #64748b; text-align: right; }
    .grid { display: flex; flex-direction: column; gap: 16px; }
    .project-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; background: #f8fafc; page-break-inside: avoid; }
    .project-title { font-size: 15px; font-weight: 700; color: #0f172a; display: flex; justify-content: space-between; align-items: center; }
    .project-role { font-size: 11px; color: #2563eb; font-weight: 600; }
    .project-desc { color: #334155; margin-top: 6px; font-size: 11.5px; line-height: 1.45; }
    .tech-badges { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
    .links { margin-top: 8px; font-size: 10.5px; color: #64748b; }
    .links a { color: #2563eb; text-decoration: none; font-weight: 500; margin-right: 12px; }
    footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(preferences.fullName || "Bewerber")}</h1>
      <div class="subtitle">Praxis-Projektportfolio & Referenzen • ${escapeHtml(preferences.desiredRole || "Frontend Engineer")}</div>
    </div>
    <div class="contact">
      ${escapeHtml(preferences.email || "")}<br>
      ${escapeHtml(preferences.city || "Köln/Bonn")}
    </div>
  </header>

  <div class="grid">
    ${projects.length === 0 ? `
      <p style="text-align: center; color: #64748b; padding: 40px 0;">Noch keine Praxisprojekte in den Einstellungen hinterlegt.</p>
    ` : projects.map((p) => `
      <div class="project-card">
        <div class="project-title">
          <span>${escapeHtml(p.title)}</span>
          <span class="project-role">${escapeHtml(p.role || "Lead Developer")}</span>
        </div>
        ${p.description ? `<p class="project-desc">${escapeHtml(p.description)}</p>` : ""}
        ${p.techStack ? `
          <div class="tech-badges">
            ${p.techStack.split(",").map((t) => `<span class="badge">#${escapeHtml(t.trim())}</span>`).join("")}
          </div>
        ` : ""}
        ${p.url ? `
          <div class="links">
            <a href="${escapeHtml(p.url)}">🌐 Projekt-Link / Demo: ${escapeHtml(p.url)}</a>
          </div>
        ` : ""}
      </div>
    `).join("")}
  </div>

  <footer>
    Erstellt mit Job Application & Career Manager • Stand: ${new Date().toLocaleDateString("de-DE")}
  </footer>
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
