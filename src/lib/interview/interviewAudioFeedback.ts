// -----------------------------------------------------------------------------
// Interview Audio & Feedback Extractor (Transkript- & Notizen-Audit)
// -----------------------------------------------------------------------------
// Analysiert Freitext-Gesprächsnotizen oder Sprachmemos nach einem Vorstellungsgespräch:
// - Erkannte Stärken & positive Signale
// - Erkannte Wissenslücken / Unsicherheiten
// - Gestellte Fragen & strategische Nachfass-Empfehlungen
// -----------------------------------------------------------------------------

export interface InterviewFeedbackInsight {
  strengths: string[];
  weaknesses: string[];
  discussedTopics: string[];
  followUpAdvice: string;
  sentiment: "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "CRITICAL";
  readinessScore: number; // 0 - 100
}

const POSITIVE_INDICATORS = [
  "guter eindruck",
  "sympathisch",
  "team passt",
  "interesse signalisiert",
  "angebot in aussicht",
  "nächste runde",
  "überzeugend",
  "fragen souverän",
  "probeaufgabe gut",
  "schnelle rückmeldung",
  "willkommen",
];

const WEAKNESS_INDICATORS = [
  "unsicher",
  "wusste nicht",
  "lücke",
  "schwierige frage",
  "nervös",
  "keine erfahrung mit",
  "nachhaken müssen",
  "kritisch gesehen",
  "zeit knapp",
  "gehalt zu hoch",
];

const TECH_TOPICS = [
  "react",
  "next.js",
  "typescript",
  "javascript",
  "tailwind",
  "css",
  "state management",
  "redux",
  "zustand",
  "testing",
  "jest",
  "vitest",
  "docker",
  "git",
  "sql",
  "rest api",
  "agil",
  "scrum",
  "architektur",
  "clean code",
  "gehalt",
  "remote",
];

export function analyzeInterviewNotes(notes: string): InterviewFeedbackInsight {
  const clean = notes.trim().toLowerCase();
  if (!clean) {
    return {
      strengths: [],
      weaknesses: [],
      discussedTopics: [],
      followUpAdvice: "Trage deine Gedanken oder ein Sprachmemo ein, um ein strukturiertes Audit zu erhalten.",
      sentiment: "NEUTRAL",
      readinessScore: 50,
    };
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const discussedTopics: string[] = [];

  for (const pos of POSITIVE_INDICATORS) {
    if (clean.includes(pos)) {
      strengths.push(pos.charAt(0).toUpperCase() + pos.slice(1));
    }
  }

  for (const neg of WEAKNESS_INDICATORS) {
    if (clean.includes(neg)) {
      weaknesses.push(neg.charAt(0).toUpperCase() + neg.slice(1));
    }
  }

  for (const topic of TECH_TOPICS) {
    if (new RegExp(`\\b${topic}\\b`, "i").test(clean)) {
      discussedTopics.push(topic.toUpperCase());
    }
  }

  let score = 65 + strengths.length * 10 - weaknesses.length * 12;
  score = Math.max(15, Math.min(98, score));

  let sentiment: InterviewFeedbackInsight["sentiment"] = "POSITIVE";
  if (score >= 80) sentiment = "VERY_POSITIVE";
  else if (score >= 60) sentiment = "POSITIVE";
  else if (score >= 40) sentiment = "NEUTRAL";
  else sentiment = "CRITICAL";

  let followUpAdvice = "";
  if (sentiment === "VERY_POSITIVE") {
    followUpAdvice = "Hervorragender Eindruck! Sende innerhalb von 24 Stunden eine kurze Dankes-E-Mail und beziehe dich auf besprochene Themen.";
  } else if (weaknesses.length > 0) {
    followUpAdvice = `Nutze die Dankes-E-Mail, um kurz auf das Thema einzugehen und z.B. einen Code-Link oder ein Praxisbeispiel nachzureichen.`;
  } else {
    followUpAdvice = "Halte den Kontakt aufrecht und frage nach dem Zeitplan für die nächsten Schritte.";
  }

  return {
    strengths,
    weaknesses,
    discussedTopics,
    followUpAdvice,
    sentiment,
    readinessScore: score,
  };
}
