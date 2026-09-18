// -----------------------------------------------------------------------------
// Company Culture & Vorbereitungs-Checkliste Datenmodell & Helfer
// -----------------------------------------------------------------------------

export interface CompanyPrepItem {
  id: string;
  label: string;
  category: "RESEARCH" | "CULTURE" | "QUESTIONS";
  completed: boolean;
  hint?: string;
}

export interface CompanyCultureProfile {
  kununuScore?: number | null; // z.B. 4.2 von 5.0
  recommendationRatePct?: number | null; // z.B. 85%
  cultureAtmosphere?: string | null; // z.B. "Start-up Mentalität, flache Hierarchien"
  pros?: string[];
  cons?: string[];
  checklist: CompanyPrepItem[];
}

export const DEFAULT_COMPANY_PREP_CHECKLIST: CompanyPrepItem[] = [
  {
    id: "prep-1",
    label: "Website & neueste Blogposts/News der letzten 3 Monate gelesen",
    category: "RESEARCH",
    completed: false,
    hint: "Prüfe Firmen-Blog, LinkedIn-Postings oder Pressemitteilungen.",
  },
  {
    id: "prep-2",
    label: "Kununu / Glassdoor Mitarbeiter-Bewertungen analysiert",
    category: "CULTURE",
    completed: false,
    hint: "Suche gezielt nach Feedback zur IT-Abteilung / Tech-Kultur.",
  },
  {
    id: "prep-3",
    label: "Produkte / Live-Demos des Unternehmens selbst ausprobiert",
    category: "RESEARCH",
    completed: false,
    hint: "Verstehe das Geschäftsmodell und die Zielgruppe des Arbeitgebers.",
  },
  {
    id: "prep-4",
    label: "Mindestens 3 spezifische Fragen zur Teamkultur & Code-Qualität notiert",
    category: "QUESTIONS",
    completed: false,
    hint: "Frage z.B. nach Release-Zyklen, Onboarding und Fehlerkultur.",
  },
  {
    id: "prep-5",
    label: "LinkedIn-Profil der Interviewpartner kurz gesichtet",
    category: "RESEARCH",
    completed: false,
    hint: "Finde Gemeinsamkeiten (Technologien, Werdegang, Interessen).",
  },
];

export function calculatePrepProgress(items: CompanyPrepItem[]): {
  total: number;
  completed: number;
  progressPct: number;
} {
  if (items.length === 0) return { total: 0, completed: 0, progressPct: 100 };
  const completed = items.filter((i) => i.completed).length;
  const progressPct = Math.round((completed / items.length) * 100);
  return { total: items.length, completed, progressPct };
}
