// -----------------------------------------------------------------------------
// Lebenslauf-Generator / CV Designer
// -----------------------------------------------------------------------------
// Erzeugt strukturierte Lebenslauf-Daten und druckfertige HTML-Vorlagen
// auf Basis des Nutzerprofils, Ausbildungsdaten und Referenzprojekten.
// -----------------------------------------------------------------------------
import type { PreferencesWithProfile } from "@/types";

export type CvLayout = "MODERN" | "CLASSIC" | "COMPACT";

export type CvOptions = {
  layout: CvLayout;
  showPhotoPlaceholder?: boolean;
  selectedProjectIds?: string[];
  selectedEducationIds?: string[];
};

export function formatMonthYear(dateString?: Date | string | null): string {
  if (!dateString) return "heute";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "heute";
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${year}`;
}

export function generateCvHtml(preferences: PreferencesWithProfile, options: CvOptions): string {
  const { layout } = options;
  const eduList = options.selectedEducationIds
    ? preferences.educationEntries.filter((e) => options.selectedEducationIds!.includes(e.id))
    : preferences.educationEntries;

  const projList = options.selectedProjectIds
    ? preferences.projectEntries.filter((p) => options.selectedProjectIds!.includes(p.id))
    : preferences.projectEntries;

  const skills = preferences.techStack.split(",").map((s) => s.trim()).filter(Boolean);

  const contactItems = [
    preferences.street,
    [preferences.postalCode, preferences.city].filter(Boolean).join(" "),
    preferences.email ? `E-Mail: ${preferences.email}` : null,
    preferences.phone ? `Tel: ${preferences.phone}` : null,
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Lebenslauf - ${escapeHtml(preferences.fullName || "Bewerber")}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; background: #fff; padding: 30px; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .name { font-size: 24px; font-weight: bold; color: #0f172a; }
    .role { font-size: 15px; color: #4f46e5; font-weight: 600; margin-top: 2px; }
    .contact { font-size: 11px; color: #64748b; text-align: right; }
    .section { margin-bottom: 18px; }
    .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 8px; letter-spacing: 0.5px; }
    .entry { margin-bottom: 10px; }
    .entry-header { display: flex; justify-content: space-between; font-weight: 600; color: #1e293b; }
    .entry-inst { color: #64748b; font-size: 12px; }
    .entry-desc { font-size: 12px; color: #334155; margin-top: 2px; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-tag { background: #eef2ff; color: #4338ca; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 500; }
    .profile-summary { font-size: 12px; color: #334155; margin-bottom: 15px; font-style: italic; background: #f8fafc; padding: 8px 12px; border-left: 3px solid #4f46e5; border-radius: 2px; }
    
    ${layout === "COMPACT" ? `body { padding: 15px; font-size: 12px; } .section { margin-bottom: 12px; } .name { font-size: 20px; }` : ""}
    ${layout === "CLASSIC" ? `.header { border-bottom: 2px solid #334155; } .role { color: #334155; } .section-title { color: #0f172a; border-bottom: 1px solid #0f172a; } .skill-tag { background: #f1f5f9; color: #0f172a; }` : ""}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="name">${escapeHtml(preferences.fullName || "Max Mustermann")}</div>
      <div class="role">${escapeHtml(preferences.desiredRole)}</div>
    </div>
    <div class="contact">
      ${contactItems.map((c) => `<div>${escapeHtml(c!)}</div>`).join("")}
    </div>
  </div>

  ${preferences.profileSummary ? `<div class="profile-summary">${escapeHtml(preferences.profileSummary)}</div>` : ""}

  <div class="section">
    <div class="section-title">Ausbildung & Werdegang</div>
    ${eduList
      .map(
        (e) => `
      <div class="entry">
        <div class="entry-header">
          <span>${escapeHtml(e.title)}</span>
          <span style="font-size: 11px; font-weight: normal; color: #64748b;">
            ${formatMonthYear(e.startDate)} – ${formatMonthYear(e.endDate)}
          </span>
        </div>
        ${e.institution ? `<div class="entry-inst">${escapeHtml(e.institution)}</div>` : ""}
        ${e.description ? `<div class="entry-desc">${escapeHtml(e.description)}</div>` : ""}
      </div>
    `
      )
      .join("")}
  </div>

  <div class="section">
    <div class="section-title">Praxisprojekte & Referenzen</div>
    ${projList
      .map(
        (p) => `
      <div class="entry">
        <div class="entry-header">
          <span>${escapeHtml(p.title)}</span>
          ${p.role ? `<span style="font-size: 11px; font-weight: normal; color: #64748b;">${escapeHtml(p.role)}</span>` : ""}
        </div>
        ${p.description ? `<div class="entry-desc">${escapeHtml(p.description)}</div>` : ""}
        ${p.techStack ? `<div class="entry-desc" style="color: #4f46e5; font-size: 11px;">Tech-Stack: ${escapeHtml(p.techStack)}</div>` : ""}
      </div>
    `
      )
      .join("")}
  </div>

  <div class="section">
    <div class="section-title">Kenntnisse & Tech-Stack</div>
    <div class="skills-grid">
      ${skills.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join("")}
    </div>
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
