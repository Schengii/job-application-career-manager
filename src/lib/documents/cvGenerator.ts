// -----------------------------------------------------------------------------
// Lebenslauf-Generator / CV Designer
// -----------------------------------------------------------------------------
// Erzeugt strukturierte Lebenslauf-Daten und druckfertige HTML-Vorlagen
// auf Basis des Nutzerprofils, Ausbildungsdaten und Referenzprojekten.
// -----------------------------------------------------------------------------
import type { PreferencesWithProfile } from "@/types";

export type CvLayout = "MODERN" | "CLASSIC" | "COMPACT" | "ATS_MINIMAL" | "MODERN_TWO_COLUMN";

export type CvSection = "PROFILE" | "EDUCATION" | "PROJECTS" | "SKILLS";

export type CvOptions = {
  layout: CvLayout;
  showPhotoPlaceholder?: boolean;
  selectedProjectIds?: string[];
  selectedEducationIds?: string[];
  sectionOrder?: CvSection[];
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

  if (layout === "MODERN_TWO_COLUMN") {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Lebenslauf - ${escapeHtml(preferences.fullName || "Bewerber")}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 12px; background: #fff; display: flex; min-height: 100vh; }
    .sidebar { width: 33%; background: #0f172a; color: #f8fafc; padding: 32px 20px; display: flex; flex-col; gap: 20px; }
    .main-content { width: 67%; padding: 32px 28px; }
    .name-title { font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.2; }
    .role-title { font-size: 13px; color: #818cf8; font-weight: 600; margin-top: 4px; }
    .side-section { margin-top: 24px; }
    .side-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 10px; }
    .side-item { font-size: 11px; color: #cbd5e1; margin-bottom: 8px; line-height: 1.4; word-break: break-word; }
    .side-skill-pill { display: inline-block; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 4px; padding: 2px 6px; font-size: 10px; margin: 2px; }
    .section-main { margin-bottom: 20px; }
    .section-main-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 4px; margin-bottom: 12px; letter-spacing: 0.5px; }
    .entry-main { margin-bottom: 12px; }
    .entry-header { display: flex; justify-content: space-between; font-weight: 600; color: #0f172a; font-size: 12.5px; }
    .entry-inst { color: #4f46e5; font-size: 11.5px; font-weight: 500; }
    .entry-desc { font-size: 11.5px; color: #475569; margin-top: 2px; line-height: 1.4; }
    .profile-banner { font-size: 11.5px; color: #334155; margin-bottom: 18px; font-style: italic; background: #f8fafc; padding: 10px 14px; border-left: 3px solid #4f46e5; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="sidebar">
    <div>
      <div class="name-title">${escapeHtml(preferences.fullName || "Max Mustermann")}</div>
      <div class="role-title">${escapeHtml(preferences.desiredRole)}</div>
    </div>

    <div class="side-section">
      <div class="side-title">Kontaktdaten</div>
      ${contactItems.map((c) => `<div class="side-item">${escapeHtml(c!)}</div>`).join("")}
    </div>

    <div class="side-section">
      <div class="side-title">Tech-Stack & Skills</div>
      <div>
        ${skills.map((s) => `<span class="side-skill-pill">${escapeHtml(s)}</span>`).join("")}
      </div>
    </div>
  </div>

  <div class="main-content">
    ${preferences.profileSummary ? `<div class="profile-banner">${escapeHtml(preferences.profileSummary)}</div>` : ""}

    <div class="section-main">
      <div class="section-main-title">Beruflicher Werdegang & Ausbildung</div>
      ${eduList
        .map(
          (e) => `
        <div class="entry-main">
          <div class="entry-header">
            <span>${escapeHtml(e.title)}</span>
            <span style="font-size: 10.5px; font-weight: normal; color: #64748b;">
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

    <div class="section-main">
      <div class="section-main-title">Praxisprojekte & Referenzen</div>
      ${projList
        .map(
          (p) => `
        <div class="entry-main">
          <div class="entry-header">
            <span>${escapeHtml(p.title)}</span>
            ${p.role ? `<span style="font-size: 11px; font-weight: normal; color: #64748b;">${escapeHtml(p.role)}</span>` : ""}
          </div>
          ${p.description ? `<div class="entry-desc">${escapeHtml(p.description)}</div>` : ""}
          ${p.techStack ? `<div style="font-size: 10.5px; color: #4f46e5; margin-top: 2px;">Tech-Stack: ${escapeHtml(p.techStack)}</div>` : ""}
        </div>
      `
        )
        .join("")}
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  const sectionOrder: CvSection[] = options.sectionOrder || ["PROFILE", "EDUCATION", "PROJECTS", "SKILLS"];

  const renderedSections = sectionOrder
    .map((sec) => {
      switch (sec) {
        case "PROFILE":
          return preferences.profileSummary
            ? `<div class="profile-summary">${escapeHtml(preferences.profileSummary)}</div>`
            : "";
        case "EDUCATION":
          return `
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
          `;
        case "PROJECTS":
          return `
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
                  ${p.techStack ? `<div style="font-size: 11px; color: #4f46e5; margin-top: 2px;">Tech-Stack: ${escapeHtml(p.techStack)}</div>` : ""}
                </div>
              `
                )
                .join("")}
            </div>
          `;
        case "SKILLS":
          return `
            <div class="section">
              <div class="section-title">Kenntnisse & Tech-Stack</div>
              <div class="skills-grid">
                ${skills.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join("")}
              </div>
            </div>
          `;
        default:
          return "";
      }
    })
    .join("\n");

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Lebenslauf - ${escapeHtml(preferences.fullName || "Bewerber")}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; background: #fff; padding: 24px; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
    .name { font-size: 24px; font-weight: bold; color: #0f172a; }
    .role { font-size: 14px; color: #4f46e5; font-weight: 600; margin-top: 2px; }
    .contact { font-size: 11px; color: #64748b; text-align: right; line-height: 1.4; }
    .section { margin-bottom: 16px; page-break-inside: avoid; }
    .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 8px; letter-spacing: 0.5px; }
    .entry { margin-bottom: 10px; }
    .entry-header { display: flex; justify-content: space-between; font-weight: 600; color: #1e293b; }
    .entry-inst { color: #64748b; font-size: 12px; }
    .entry-desc { font-size: 12px; color: #334155; margin-top: 2px; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-tag { background: #eef2ff; color: #4338ca; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 500; }
    .profile-summary { font-size: 12px; color: #334155; margin-bottom: 15px; font-style: italic; background: #f8fafc; padding: 8px 12px; border-left: 3px solid #4f46e5; border-radius: 2px; }
    
    ${layout === "COMPACT" ? `body { padding: 10px; font-size: 12px; } .section { margin-bottom: 10px; } .name { font-size: 20px; }` : ""}
    ${layout === "CLASSIC" ? `.header { border-bottom: 2px solid #334155; } .role { color: #334155; } .section-title { color: #0f172a; border-bottom: 1px solid #0f172a; } .skill-tag { background: #f1f5f9; color: #0f172a; }` : ""}
    ${layout === "ATS_MINIMAL" ? `
      body { font-family: "Times New Roman", Times, serif; color: #000; padding: 10px; font-size: 13px; line-height: 1.4; }
      .header { border-bottom: 1px solid #000; display: block; text-align: center; margin-bottom: 12px; padding-bottom: 8px; }
      .name { font-size: 22px; color: #000; text-transform: uppercase; }
      .role { font-size: 13px; color: #333; font-style: italic; }
      .contact { text-align: center; font-size: 11px; color: #000; margin-top: 4px; }
      .contact div { display: inline-block; margin: 0 5px; }
      .section-title { color: #000; border-bottom: 1px solid #000; font-size: 12px; font-weight: bold; margin-bottom: 6px; }
      .skill-tag { background: none; color: #000; border: 1px solid #ccc; border-radius: 0; padding: 1px 4px; }
      .profile-summary { background: none; border-left: none; padding: 0; font-style: normal; margin-bottom: 10px; }
    ` : ""}
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

  ${renderedSections}
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
