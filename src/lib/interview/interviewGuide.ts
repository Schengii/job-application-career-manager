// -----------------------------------------------------------------------------
// Interview-Vorbereitungsleitfaden & Fachfragen-Katalog
// -----------------------------------------------------------------------------
// Bereitet Bewerber strukturiert auf Fach- und Kennenlerngespräche vor.
// Bietet gezielte Fragen, Musterantworten & Tipps nach Tech-Stack und Kategorie.
// -----------------------------------------------------------------------------

export type QuestionCategory =
  | "FRONTEND_REACT"
  | "TYPESCRIPT_JS"
  | "CSS_UI_UX"
  | "ARCHITECTURE_TESTING"
  | "CAREER_BACKGROUND"
  | "QUESTIONS_FOR_EMPLOYER";

export type InterviewQuestion = {
  id: string;
  category: QuestionCategory;
  categoryLabel: string;
  question: string;
  answerSummary: string;
  keywords: string[];
  tips?: string;
};

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // --- FRONTEND & REACT ---
  {
    id: "react-1",
    category: "FRONTEND_REACT",
    categoryLabel: "React & Frontend",
    question: "Was ist der Unterschied zwischen React Client Components und Server Components (RSC)?",
    answerSummary:
      "Server Components werden standardmäßig auf dem Server gerendert und senden kein JavaScript-Bundle an den Client (bessere Ladezeit & SEO). Client Components ('use client') werden im Browser ausgeführt und ermöglichen interaktive Hooks (useState, useEffect, Event-Listener).",
    keywords: ["React", "Next.js", "Server Components", "Client Components", "SSR"],
    tips: "Betone, dass man Komponenten standardmäßig als Server Components belässt und 'use client' nur an den Interaktions-Blättern des Komponentenbaums nutzt.",
  },
  {
    id: "react-2",
    category: "FRONTEND_REACT",
    categoryLabel: "React & Frontend",
    question: "Wie optimiert man Performance und Re-Renders in einer React-Anwendung?",
    answerSummary:
      "Durch Lokalisieren des States, gezielten Einsatz von useMemo / useCallback für teure Berechnungen, React.memo für reine Präsentationskomponenten, Virtualisierung langer Listen und Code-Splitting / Dynamic Imports.",
    keywords: ["React", "Performance", "useMemo", "useCallback", "Rendering"],
  },
  {
    id: "react-3",
    category: "FRONTEND_REACT",
    categoryLabel: "React & Frontend",
    question: "Wie funktioniert das SWR / React Query Daten-Caching-Prinzip?",
    answerSummary:
      "Stale-While-Revalidate: Liefert sofort zwischengespeicherte Daten aus dem Cache (schnelle UI), sendet parallel einen Fetch-Request im Hintergrund und aktualisiert die Ansicht bei neuen Daten automatisch.",
    keywords: ["SWR", "React Query", "Data Fetching", "Caching", "State"],
  },

  // --- TYPESCRIPT & JAVASCRIPT ---
  {
    id: "ts-1",
    category: "TYPESCRIPT_JS",
    categoryLabel: "TypeScript & JavaScript",
    question: "Was ist der Unterschied zwischen 'type' und 'interface' in TypeScript?",
    answerSummary:
      "Interfaces eignen sich hervorragend für objektorientierte Datenmodelle und unterstützen Declaration Merging. Types ('type') sind flexibler und unterstützen Union Types, Primitives, Tuples und gemappte Typen.",
    keywords: ["TypeScript", "Interface", "Type", "Typisierung"],
    tips: "In modernen Projekten wird oft 'type' für Unions/Utilities und 'interface' für erweiterbare Objektstrukturen genutzt.",
  },
  {
    id: "ts-2",
    category: "TYPESCRIPT_JS",
    categoryLabel: "TypeScript & JavaScript",
    question: "Was versteht man unter Type Narrowing und Type Guards?",
    answerSummary:
      "Type Narrowing ist das schrittweise Verfeinern eines breiten Typs (z.B. string | number) zu einem spezifischeren Typ zur Laufzeit mittels typeof, instanceof, 'in'-Operator oder benutzerdefinierten Type Guards (is Type).",
    keywords: ["TypeScript", "Type Guard", "Type Narrowing", "Zod"],
  },
  {
    id: "ts-3",
    category: "TYPESCRIPT_JS",
    categoryLabel: "TypeScript & JavaScript",
    question: "Wie funktioniert der JavaScript Event Loop (Microtasks vs. Macrotasks)?",
    answerSummary:
      "Der Event Loop überwacht den Call Stack und die Callback Queues. Synchroner Code läuft zuerst. Danach werden alle Microtasks (Promises, queueMicrotask) abgearbeitet, bevor der nächste Macrotask (setTimeout, I/O) ausgeführt wird.",
    keywords: ["JavaScript", "Event Loop", "Async", "Promise", "Microtasks"],
  },

  // --- CSS, UI & UX ---
  {
    id: "css-1",
    category: "CSS_UI_UX",
    categoryLabel: "CSS & UI/UX",
    question: "Wann nutzt man CSS Flexbox und wann CSS Grid?",
    answerSummary:
      "Flexbox ist eindimensional (entweder Zeile ODER Spalte) und ideal für Ausrichtungen, Navigationsleisten und Buttons. Grid ist zweidimensional (Zeilen UND Spalten gleichzeitig) und perfekt für komplette Seitenlayouts und Kachelstrukturen.",
    keywords: ["CSS", "Flexbox", "Grid", "Layout", "Tailwind"],
  },
  {
    id: "css-2",
    category: "CSS_UI_UX",
    categoryLabel: "CSS & UI/UX",
    question: "Wie stellt man Web-Barrierefreiheit (WCAG / A11y) sicher?",
    answerSummary:
      "Durch semantisches HTML (nav, main, button statt div-Klicks), korrekte ARIA-Attribute (aria-label, aria-expanded), sichtbare Tastatur-Fokus-Indikatoren (:focus-visible), ausreichende Farbkontraste und Screenreader-Unterstützung.",
    keywords: ["CSS", "HTML", "A11y", "Barrierefreiheit", "WCAG"],
  },

  // --- ARCHITEKTUR & TESTEN ---
  {
    id: "arch-1",
    category: "ARCHITECTURE_TESTING",
    categoryLabel: "Architektur & Testing",
    question: "Welche Testarten gibt es und worauf liegt der Fokus bei Vitest / Jest?",
    answerSummary:
      "Unit-Tests (einzelne Funktionen & Hilfsmodule isoliert testen), Integrationstests (Zusammenspiel von Komponenten & APIs) und E2E-Tests. Bei Unit-Tests liegt der Fokus auf hoher Geschwindigkeit, Randfällen und Regressionstests.",
    keywords: ["Testing", "Vitest", "Jest", "Unit Tests", "CI/CD"],
  },
  {
    id: "arch-2",
    category: "ARCHITECTURE_TESTING",
    categoryLabel: "Architektur & Testing",
    question: "Wie baut man robuste REST-APIs mit Validierung (z.B. mit Zod)?",
    answerSummary:
      "Eingehende Request-Bodies werden strikt über Schemata (wie Zod) validiert, bevor Geschäftslogik ausgeführt wird. Bei Fehlern wird ein strukturierter 400 Bad Request zurückgegeben. Dies verhindert Injection und Typfehler.",
    keywords: ["REST", "API", "Zod", "Validation", "Backend"],
  },

  // --- WERDEGANG & PROJEKTE ---
  {
    id: "career-1",
    category: "CAREER_BACKGROUND",
    categoryLabel: "Werdegang & Praxisprojekte",
    question: "Wie erkläre ich den Übergang vom Elektroniker für Betriebstechnik zum Fachinformatiker?",
    answerSummary:
      "Als Elektroniker habe ich gelernt, komplexe Systeme logisch zu analysieren, Fehler systematisch einzugrenzen und präzise zu arbeiten. Die Begeisterung für Software hat mich dazu motiviert, meine Karriere voll auf Software- & Webentwicklung auszurichten.",
    keywords: ["Werdegang", "Elektroniker", "Umschulung", "Motivation"],
    tips: "Hebe die Kombination aus technischem Grundverständnis und moderner Web-Entwicklung als Alleinstellungsmerkmal hervor.",
  },
  {
    id: "career-2",
    category: "CAREER_BACKGROUND",
    categoryLabel: "Werdegang & Praxisprojekte",
    question: "Wie präsentiere ich mein Hauptprojekt (z.B. electroCheck-ai)?",
    answerSummary:
      "Erkläre kurz: 1. Das Problem (Prüfprotokolle effizient und fehlerfrei auswerten), 2. Die Lösung & Architektur (Next.js, TypeScript, KI-Anbindung), 3. Deine konkrete Rolle & Herausforderungen (z.B. Parsing, UI/UX, Performance).",
    keywords: ["Projekt", "electroCheck-ai", "Architektur", "Fullstack"],
  },

  // --- EIGENE GEGENFRAGEN AN DEN ARBEITGEBER ---
  {
    id: "employer-1",
    category: "QUESTIONS_FOR_EMPLOYER",
    categoryLabel: "Gegenfragen an Arbeitgeber",
    question: "Wie läuft der Onboarding-Prozess und das Mentoring in den ersten Monaten ab?",
    answerSummary: "Zeigt Lernbereitschaft und Interesse an strukturierter Einarbeitung.",
    keywords: ["Onboarding", "Mentoring", "Team"],
  },
  {
    id: "employer-2",
    category: "QUESTIONS_FOR_EMPLOYER",
    categoryLabel: "Gegenfragen an Arbeitgeber",
    question: "Wie sieht der typische Entwicklungs- und Release-Zyklus im Team aus (Code Reviews, CI/CD)?",
    answerSummary: "Zeigt Interesse an Code-Qualität, Standards und professionellen Arbeitsabläufen.",
    keywords: ["CI/CD", "Code Review", "Workflow", "Qualität"],
  },
  {
    id: "employer-3",
    category: "QUESTIONS_FOR_EMPLOYER",
    categoryLabel: "Gegenfragen an Arbeitgeber",
    question: "An welchen konkreten Projekten würde ich voraussichtlich im ersten halben Jahr arbeiten?",
    answerSummary: "Klärt sofort die Erwartungshaltung und die alltäglichen Aufgaben.",
    keywords: ["Projekte", "Aufgaben", "Erwartungen"],
  },
];

export function getQuestionsForTechStack(techStackString?: string | null): InterviewQuestion[] {
  if (!techStackString?.trim()) return INTERVIEW_QUESTIONS;

  const techs = techStackString
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  return INTERVIEW_QUESTIONS.filter((q) => {
    // Allgemeine Werdegangs- und Arbeitgeberfragen immer anzeigen
    if (q.category === "CAREER_BACKGROUND" || q.category === "QUESTIONS_FOR_EMPLOYER") {
      return true;
    }
    // Fachfragen basierend auf Keywords filtern
    return q.keywords.some((kw) => techs.some((t) => kw.toLowerCase().includes(t) || t.includes(kw.toLowerCase())));
  });
}
