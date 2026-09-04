// -----------------------------------------------------------------------------
// Anschreiben Keyword-Booster & ATS (Applicant Tracking System) Match Engine
// -----------------------------------------------------------------------------

export interface KeywordMatchResult {
  matchedKeywords: string[];
  missingKeywords: string[];
  matchScore: number; // 0–100%
  totalTargetKeywords: number;
  suggestions: { keyword: string; sampleSentence: string }[];
}

const SAMPLE_SENTENCES_BY_KEYWORD: Record<string, string> = {
  typescript: "Dank fundierter Kenntnisse in TypeScript schreibe ich typsicheren, wartbaren und robusten Code.",
  react: "In modernen React-Anwendungen setze ich auf funktionale Komponenten, Hooks und effizientes State-Management.",
  "next.js": "Mit Next.js (App Router, Server Components) entwickle ich performante und SEO-optimierte Webanwendungen.",
  tailwind: "Moderne, responsive Benutzeroberflächen setze ich schnell und sauber mit Tailwind CSS um.",
  css: "Flexbox, CSS Grid und moderne CSS-Architekturen nutze ich sicher für responsive Layouts.",
  html: "Ich lege großen Wert auf semantisches HTML5 und barrierefreie Oberflächen (A11y/WCAG).",
  rest: "Die Anbindung und Konzeption von RESTful APIs mit Zod-Validierung ist fester Bestandteil meiner täglichen Praxis.",
  git: "Versionskontrolle, Branching-Strategien und kollaboratives Arbeiten via Git gehören zu meinem Standard.",
  testing: "Automatisierte Unit- und Integrationstests (z. B. mit Vitest / Jest) sichern die hohe Qualität meines Codes.",
  vitest: "Unit-Tests und Test-Driven Development setze ich gezielt mit Vitest um.",
  "ui/ux": "Ein intuitives Nutzungserlebnis und pixelgenaues UI/UX-Design stehen bei meiner Entwicklung im Mittelpunkt.",
  agil: "Agile Methoden wie Scrum und Kanban sind mir aus der täglichen Projektarbeit vertraut.",
  docker: "Containerisierung und reproduzierbare Umgebungen mit Docker sind mir bestens vertraut.",
  "clean code": "Clean Code, SOLID-Prinzipien und saubere Code-Strukturen sind für mich selbstverständlich.",
};

const COMMON_FRONTEND_KEYWORDS = [
  "typescript",
  "react",
  "next.js",
  "javascript",
  "tailwind",
  "css",
  "html",
  "rest",
  "git",
  "testing",
  "ui/ux",
  "clean code",
  "agil",
];

export function analyzeCoverLetterKeywords(
  coverLetterText: string,
  jobDescriptionOrStack: string = ""
): KeywordMatchResult {
  const textLower = coverLetterText.toLowerCase();
  const jobLower = jobDescriptionOrStack.toLowerCase();

  // Sammle alle Ziel-Keywords aus Stellenbeschreibung + Standard Frontend Keywords
  const targetKeywordSet = new Set<string>();

  COMMON_FRONTEND_KEYWORDS.forEach((kw) => targetKeywordSet.add(kw));

  // Extrahiere weitere Begriffe aus Stellenanzeige falls vorhanden
  const potentialKeywords = [
    "docker",
    "vitest",
    "jest",
    "redux",
    "zustand",
    "graphql",
    "ci/cd",
    "storybook",
    "accessibility",
    "figma",
    "sql",
    "prisma",
  ];

  potentialKeywords.forEach((kw) => {
    if (jobLower.includes(kw)) {
      targetKeywordSet.add(kw);
    }
  });

  const allTargetKeywords = Array.from(targetKeywordSet);
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const suggestions: { keyword: string; sampleSentence: string }[] = [];

  for (const kw of allTargetKeywords) {
    // Prüfe ob Keyword im Anschreiben vorkommt
    const regex = new RegExp(`\\b${kw.replace(".", "\\.")}\\b`, "i");
    if (regex.test(textLower) || textLower.includes(kw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
      if (SAMPLE_SENTENCES_BY_KEYWORD[kw]) {
        suggestions.push({
          keyword: kw,
          sampleSentence: SAMPLE_SENTENCES_BY_KEYWORD[kw],
        });
      }
    }
  }

  const matchScore =
    allTargetKeywords.length > 0
      ? Math.round((matchedKeywords.length / allTargetKeywords.length) * 100)
      : 100;

  return {
    matchedKeywords,
    missingKeywords,
    matchScore,
    totalTargetKeywords: allTargetKeywords.length,
    suggestions: suggestions.slice(0, 4), // Top 4 Vorschläge
  };
}
