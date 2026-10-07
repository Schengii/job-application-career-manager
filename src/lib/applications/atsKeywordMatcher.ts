// -----------------------------------------------------------------------------
// ATS Keyword Matcher Engine (Side-by-Side Audit)
// -----------------------------------------------------------------------------
// Analysiert geforderte Tech- & Fachbegriffe aus der Stellenanzeige und
// vergleicht sie in Echtzeit mit dem Anschreiben und dem CV-Profil.
// -----------------------------------------------------------------------------

export type KeywordCategory = "TECH_STACK" | "METHODOLOGY" | "TOOL" | "SOFT_SKILL";

export type AtsKeywordItem = {
  keyword: string;
  category: KeywordCategory;
  inJobPosting: boolean;
  inCoverLetter: boolean;
  inCv: boolean;
  frequencyInCoverLetter: number;
  snippetSuggestion?: string;
};

export type AtsMatchAnalysis = {
  atsScore: number; // 0 - 100
  totalJobKeywords: number;
  matchedCount: number;
  missingCount: number;
  keywords: AtsKeywordItem[];
  missingKeywords: AtsKeywordItem[];
  matchedKeywords: AtsKeywordItem[];
};

const COMMON_KEYWORDS: Record<string, { category: KeywordCategory; suggestion: string }> = {
  "react": { category: "TECH_STACK", suggestion: "Praktische Erfahrung mit React (Hooks, Context, State-Management, performante UIs)." },
  "react 19": { category: "TECH_STACK", suggestion: "Aktuelle Kenntnisse moderner React-19-Architekturen (useActionState, Server Actions, RSC)." },
  "typescript": { category: "TECH_STACK", suggestion: "Konsequenter Einsatz von TypeScript für typsichere, wartbare Frontend-Architekturen." },
  "javascript": { category: "TECH_STACK", suggestion: "Fundiertes JavaScript-Wissen (ES6+, Asynchronität, Event Loop, DOM-APIs)." },
  "next.js": { category: "TECH_STACK", suggestion: "Erfahrung mit Next.js (App Router, Server Components, SSR/SSG und Routing)." },
  "tailwind": { category: "TECH_STACK", suggestion: "Entwicklung moderner, barrierefreier Designs mit Tailwind CSS." },
  "css": { category: "TECH_STACK", suggestion: "Tiefes Verständnis von CSS (Flexbox, Grid, Custom Properties, Responsive Design)." },
  "html": { category: "TECH_STACK", suggestion: "Semantisches HTML5 unter strikter Beachtung von Webstandards und Barrierefreiheit (a11y)." },
  "git": { category: "TOOL", suggestion: "Routinierte Versionsverwaltung mit Git, Feature-Branches und Pull-Request-Reviews." },
  "docker": { category: "TOOL", suggestion: "Containerisierung von Anwendungen mit Docker für reproduzierbare Build- und Test-Umgebungen." },
  "rest": { category: "TECH_STACK", suggestion: "Entwicklung und Anbindung robuster RESTful APIs mit Zod-Validierung." },
  "testing": { category: "METHODOLOGY", suggestion: "Automatisierte Tests auf Komponenten- und E2E-Ebene (Vitest, React Testing Library, Playwright)." },
  "vitest": { category: "TOOL", suggestion: "Unit- und Integrationstests mit Vitest für schnelle Feedback-Zyklen." },
  "jest": { category: "TOOL", suggestion: "Erfahrung mit Jest zur Absicherung von Unit- und Snapshot-Tests." },
  "playwright": { category: "TOOL", suggestion: "End-to-End-Testing kritischer Benutzerflüsse mit Playwright." },
  "agile": { category: "METHODOLOGY", suggestion: "Erfahrung in agilen Entwicklungsprozessen (Scrum, Kanban, iterative Sprints)." },
  "scrum": { category: "METHODOLOGY", suggestion: "Zusammenarbeit in cross-funktionalen Scrum-Teams mit Daily Standups und Retrospektiven." },
  "clean code": { category: "METHODOLOGY", suggestion: "Fokus auf Clean Code, SOLID-Prinzipien und leicht erweiterbare Architektur." },
  "barrierefreiheit": { category: "METHODOLOGY", suggestion: "Umsetzung von Barrierefreiheit nach BITV / WCAG für zugängliche Benutzeroberflächen." },
  "a11y": { category: "METHODOLOGY", suggestion: "Gezielter Einsatz semantischer ARIA-Rollen und barrierefreier Tastaturnavigation." },
  "ci/cd": { category: "TOOL", suggestion: "Einbindung in automatisierte CI/CD-Pipelines (z. B. GitHub Actions) für kontinuierliches Deployment." },
  "teamfähigkeit": { category: "SOFT_SKILL", suggestion: "Strukturierte, wertschätzende Teamkommunikation und Freude am gemeinsamen Pair Programming." },
  "eigeninitiative": { category: "SOFT_SKILL", suggestion: "Hohe Eigeninitiative bei der Analyse und Lösung komplexer technischer Fragestellungen." },
};

/**
 * Durchsucht Text nach einem Schlüsselwort (Wortgrenzen-resistent).
 */
function testKeywordInText(keyword: string, text: string): { found: boolean; count: number } {
  if (!text || !keyword) return { found: false, count: 0 };
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  const matches = text.match(regex);
  return {
    found: Boolean(matches && matches.length > 0),
    count: matches ? matches.length : 0,
  };
}

/**
 * Extrahiert Keywords aus dem Text der Stellenanzeige und gleicht sie ab.
 */
export function analyzeAtsKeywords(
  jobDescriptionText: string,
  coverLetterText: string,
  cvText: string = ""
): AtsMatchAnalysis {
  const combinedJobText = (jobDescriptionText || "").toLowerCase();
  const clText = coverLetterText || "";
  const profileText = cvText || "";

  const items: AtsKeywordItem[] = [];

  for (const [kw, meta] of Object.entries(COMMON_KEYWORDS)) {
    const jobCheck = testKeywordInText(kw, combinedJobText);

    // Wenn das Keyword in der Anzeige vorkommt
    if (jobCheck.found) {
      const clCheck = testKeywordInText(kw, clText);
      const cvCheck = testKeywordInText(kw, profileText);

      items.push({
        keyword: kw.toUpperCase() === kw ? kw : kw.charAt(0).toUpperCase() + kw.slice(1),
        category: meta.category,
        inJobPosting: true,
        inCoverLetter: clCheck.found,
        inCv: cvCheck.found,
        frequencyInCoverLetter: clCheck.count,
        snippetSuggestion: meta.suggestion,
      });
    }
  }

  // Zusätzliche Wörter aus dem Text extrahieren, die typisch für Anforderungen sind
  const matchedKeywords = items.filter((i) => i.inCoverLetter || i.inCv);
  const missingKeywords = items.filter((i) => !i.inCoverLetter);

  const total = items.length;
  const matchedCount = items.filter((i) => i.inCoverLetter).length;
  const atsScore = total > 0 ? Math.round((matchedCount / total) * 100) : 100;

  return {
    atsScore,
    totalJobKeywords: total,
    matchedCount,
    missingCount: missingKeywords.length,
    keywords: items,
    missingKeywords,
    matchedKeywords,
  };
}
