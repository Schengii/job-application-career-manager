// -----------------------------------------------------------------------------
// Multi-Round Interview Stage Manager
// -----------------------------------------------------------------------------
// Ermöglicht das strukturierte Verwalten mehrstufiger IT-Interviewprozesse
// (Screening -> Coding Challenge -> Tech Deep Dive -> Team Fit -> Offer)
// inklusive Terminen, Ansprechpartnern, Vorbereitungsnotizen und Feedback.
// -----------------------------------------------------------------------------

export type InterviewRoundType =
  | "SCREENING"
  | "CODING_CHALLENGE"
  | "TECH_INTERVIEW"
  | "FINAL_ROUND"
  | "OFFER_STAGE";

export type InterviewRoundStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "PASSED"
  | "FEEDBACK_PENDING"
  | "REJECTED";

export interface InterviewRoundData {
  id: string;
  roundNumber: number;
  stage: InterviewRoundType;
  title: string;
  interviewerNames?: string;
  interviewerRoles?: string;
  scheduledAt?: string; // ISO String
  durationMinutes: number;
  meetingUrl?: string;
  status: InterviewRoundStatus;
  prepNotes?: string;
  feedbackNotes?: string;
  keyQuestionsToAsk?: string[];
  evaluationScore?: number; // 1 - 5 Sterne
}

export const STAGE_CONFIGS: Record<
  InterviewRoundType,
  {
    label: string;
    defaultDuration: number;
    description: string;
    prepChecklist: string[];
    suggestedQuestionsToAsk: string[];
  }
> = {
  SCREENING: {
    label: "1. HR / Talent Screening",
    defaultDuration: 30,
    description: "Kennenlernen, Werdegang, Rahmenbedingungen, Gehaltsrahmen & Motivation.",
    prepChecklist: [
      "2-Minuten-Pitch ('Tell me about yourself') flüssig parat haben",
      "Kündigungsfrist / Verfügbarkeit und Gehaltsvorstellung präzise nennen",
      "Motivation für das Unternehmen und Frontend-Schwerpunkt betonen",
    ],
    suggestedQuestionsToAsk: [
      "Wie sieht der weitere Bewerbungsprozess und die Timeline aus?",
      "Wie ist das Frontend-Team aktuell aufgestellt und welches Projekt hat oberste Priorität?",
    ],
  },
  CODING_CHALLENGE: {
    label: "2. Coding Challenge / Take-Home",
    defaultDuration: 60,
    description: "Praktische Programmieraufgabe, React-Architektur, TypeScript & Clean Code.",
    prepChecklist: [
      "Saubere Komponenten-Struktur und TypeScript-Typisierung ohne 'any'",
      "Testing mit Vitest / Jest oder Playwright einbinden",
      "Aussagekräftige README mit Start-Anleitung und Architekturentscheidungen",
    ],
    suggestedQuestionsToAsk: [
      "Gibt es spezielle Vorgaben bzgl. State-Management oder Tailwind-Version?",
      "Wird der Code gemeinsam im Tech-Interview besprochen (Review-Runde)?",
    ],
  },
  TECH_INTERVIEW: {
    label: "3. Tech Deep-Dive & System Design",
    defaultDuration: 60,
    description: "Fachgespräch mit Tech Lead / Senior Devs über Next.js, Web-Vitals, Architektur.",
    prepChecklist: [
      "React 19 Hooks (useActionState, useOptimistic) & Server Components erklären können",
      "Web-Performance (INP, LCP, CLS, Bundle-Splitting) praxisnah erläutern",
      "Eigene Projekt-Anekdoten (electroCheck-ai) zur Fehlerbehebung parat haben",
    ],
    suggestedQuestionsToAsk: [
      "Wie sieht eure CI/CD-Pipeline und der Release-Prozess für das Frontend aus?",
      "Wie trefft ihr Entscheidungen bei Tech-Stack-Upgrades oder Refactorings?",
    ],
  },
  FINAL_ROUND: {
    label: "4. Team Fit & Management Call",
    defaultDuration: 45,
    description: "Kultureller Fit, Zusammenarbeit im Team, Engineering Manager / GF.",
    prepChecklist: [
      "Werte des Unternehmens und Feedback-Kultur ansprechen",
      "Beispiele für erfolgreiche Zusammenarbeit und Konfliktlösung nennen",
      "Eigene Lernziele für das erste Jahr formulieren",
    ],
    suggestedQuestionsToAsk: [
      "Was zeichnet die erfolgreichsten Entwickler in diesem Team aus?",
      "Wie fördert ihr persönliche Weiterbildung (Budget, Konferenzen)?",
    ],
  },
  OFFER_STAGE: {
    label: "5. Vertragsangebot & Offer Call",
    defaultDuration: 30,
    description: "Besprechung des Angebots, Vergütung, Benefits, Starttermin und Vertrag.",
    prepChecklist: [
      "Eigene BATNA und Gegenangebot-Verhandlungsargumente vorbereiten",
      "Benefits (Home-Office, Deutschlandticket, bAV, Hardware) prüfen",
      "Arbeitsvertrags-Klauseln (Überstunden, Probezeit) im Detail sichten",
    ],
    suggestedQuestionsToAsk: [
      "Bis wann benötigt ihr die finale Rückmeldung zum Angebot?",
      "Könnt ihr mir den Entwurf des Arbeitsvertrags vorab per PDF zusenden?",
    ],
  },
};

/**
 * Erzeugt eine Standard-Runde basierend auf dem gewählten Typ.
 */
export function createDefaultRound(
  stage: InterviewRoundType,
  roundNumber: number
): InterviewRoundData {
  const config = STAGE_CONFIGS[stage];
  return {
    id: `round-${Date.now()}-${roundNumber}`,
    roundNumber,
    stage,
    title: config.label,
    durationMinutes: config.defaultDuration,
    status: "SCHEDULED",
    prepNotes: "",
    feedbackNotes: "",
    keyQuestionsToAsk: [...config.suggestedQuestionsToAsk],
  };
}

/**
 * Parst serialisierte Runden aus dem summary-Feld von ApplicationInteraction.
 */
export function parseRoundsFromInteractionSummary(summary?: string | null): InterviewRoundData[] {
  if (!summary) return [];
  try {
    const parsed = JSON.parse(summary);
    if (Array.isArray(parsed)) return parsed as InterviewRoundData[];
    return [];
  } catch {
    return [];
  }
}

/**
 * Serialisiert Runden für die Speicherung in ApplicationInteraction.
 */
export function serializeRoundsToInteractionSummary(rounds: InterviewRoundData[]): string {
  return JSON.stringify(rounds);
}
