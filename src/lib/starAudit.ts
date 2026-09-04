// -----------------------------------------------------------------------------
// KI-Antwort-Audit nach der STAR-Methode (Situation, Task, Action, Result)
// -----------------------------------------------------------------------------
// Evaluiert Interview-Antworten (aus Sprachdiktat oder Notizen) strukturiert nach
// dem weltweit führenden HR-Interviewstandard für Entwickler.
// -----------------------------------------------------------------------------

export type StarDimension = {
  name: "Situation" | "Task" | "Action" | "Result";
  label: string;
  score: number; // 0 - 25
  status: "EXCELLENT" | "SOLID" | "NEEDS_WORK";
  feedback: string;
};

export type StarAuditResult = {
  totalScore: number; // 0 - 100
  rating: "Hervorragend" | "Solide" | "Ausbaufähig";
  dimensions: StarDimension[];
  strengths: string[];
  improvements: string[];
  improvedSampleAnswer: string;
};

export function auditAnswerWithStar(question: string, answer: string): StarAuditResult {
  const text = (answer || "").trim();

  if (!text || text.length < 20) {
    return {
      totalScore: 15,
      rating: "Ausbaufähig",
      dimensions: [
        { name: "Situation", label: "Situation (Kontext)", score: 5, status: "NEEDS_WORK", feedback: "Kein klarer Projekt- oder Arbeitskontext erkennbar." },
        { name: "Task", label: "Task (Aufgabenstellung)", score: 5, status: "NEEDS_WORK", feedback: "Die konkrete Herausforderung wurde nicht formuliert." },
        { name: "Action", label: "Action (Deine Handlungen)", score: 5, status: "NEEDS_WORK", feedback: "Beschreibe konkrete technische Schritte in der Ich-Form." },
        { name: "Result", label: "Result (Messbares Ergebnis)", score: 0, status: "NEEDS_WORK", feedback: "Kein messbares Ergebnis oder Learning genannt." },
      ],
      strengths: [],
      improvements: ["Antwort ist zu kurz. Nutze Situation, Aufgabe, konkrete Handlung und Ergebnis."],
      improvedSampleAnswer: "In meinem Projekt electroCheck-ai stand ich vor der Aufgabe, komplexe Prüfprotokolle performant im Browser zu rendern. Ich habe die Architektur auf Next.js Server Components und Zod umgestellt, wodurch die Renderzeiten um 40% sanken.",
    };
  }

  const lower = text.toLowerCase();

  // 1. Situation prüfen (Projekt, Kunde, Team, Rahmen)
  const situationKeywords = ["in meinem projekt", "bei", "im team", "als ich", "damals", "kunde", "ausbildung", "umschulung", "anwendung"];
  const hasSituation = situationKeywords.some((k) => lower.includes(k));
  const situationScore = hasSituation ? 22 : 12;

  // 2. Task prüfen (Problem, Herausforderung, Ziel, Anforderung)
  const taskKeywords = ["aufgabe", "ziel war", "herausforderung", "problem", "anforderung", "musste", "sollte", "ziel"];
  const hasTask = taskKeywords.some((k) => lower.includes(k));
  const taskScore = hasTask ? 23 : 13;

  // 3. Action prüfen (Ich-Form, konkrete Technologien, Umsetzung)
  const actionKeywords = ["ich habe", "ich entwickelte", "ich implementierte", "umgesetzt", "entwickelt", "optimiert", "refaktoriert", "react", "typescript", "next", "zod", "css", "api"];
  const hasAction = actionKeywords.some((k) => lower.includes(k));
  const actionScore = hasAction ? 24 : 14;

  // 4. Result prüfen (Ergebnis, Metriken, Lerneffekt, Feedback)
  const resultKeywords = ["dadurch", "ergebnis", "erfolgreich", "%", "prozent", "schneller", "fehlerfrei", "feedback", "gelernt", "abnahme"];
  const hasResult = resultKeywords.some((k) => lower.includes(k));
  const resultScore = hasResult ? 23 : 11;

  const totalScore = situationScore + taskScore + actionScore + resultScore;

  const dimensions: StarDimension[] = [
    {
      name: "Situation",
      label: "Situation (Kontext)",
      score: situationScore,
      status: situationScore >= 20 ? "EXCELLENT" : "SOLID",
      feedback: hasSituation
        ? "Guter Einstieg mit klarem Bezug zu deinem Praxiskontext."
        : "Nenne zu Beginn konkret das Projekt oder Unternehmen, in dem die Situation stattfand.",
    },
    {
      name: "Task",
      label: "Task (Aufgabenstellung)",
      score: taskScore,
      status: taskScore >= 20 ? "EXCELLENT" : "SOLID",
      feedback: hasTask
        ? "Die Problemstellung und Zielsetzung wurden nachvollziehbar dargelegt."
        : "Formuliere präziser, was genau das Kernproblem war, das gelöst werden musste.",
    },
    {
      name: "Action",
      label: "Action (Deine Handlungen)",
      score: actionScore,
      status: actionScore >= 20 ? "EXCELLENT" : "SOLID",
      feedback: hasAction
        ? "Starke Ich-Formulierung mit Nennung konkreter technischer Lösungsansätze."
        : "Betone stärker deine eigene technische Rolle (welche Bibliotheken/Patterns hast du gewählt?).",
    },
    {
      name: "Result",
      label: "Result (Messbares Ergebnis)",
      score: resultScore,
      status: resultScore >= 20 ? "EXCELLENT" : "NEEDS_WORK",
      feedback: hasResult
        ? "Überzeugender Abschluss mit spürbarem Nutzen oder konkretem Lerneffekt."
        : "Schließe mit einem greifbaren Ergebnis ab (z. B. fehlerfreier Release, positive Code-Review-Rückmeldung).",
    },
  ];

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (hasAction) strengths.push("Klare Darstellung der eigenverantwortlichen technischen Umsetzung.");
  if (hasSituation) strengths.push("Guter Praxisbezug zu realen Entwicklungsprojekten.");
  if (!hasResult) improvements.push("Ergänze am Ende ein messbares Resultat (z. B. Zeiteinsparung, stabile Funktion, zufriedene Nutzer).");
  if (!lower.includes("ich ")) improvements.push("Verwende öfter 'Ich habe...' statt vagem 'Wir haben...', um deine persönliche Leistung hervorzuheben.");

  const improvedSampleAnswer = `(Situation) In meinem Projekt electroCheck-ai standen wir vor der Herausforderung, dass umfangreiche Messprotokolle im Frontend zu spürbaren Verzögerungen führten. (Task) Meine Aufgabe war es, die Rendering-Performance zu optimieren und Typsicherheit über API-Grenzen hinweg sicherzustellen. (Action) Dafür habe ich die Datenstrukturen mit TypeScript und Zod modularisiert und gezielt React-Memoization sowie Server-Pagination implementiert. (Result) Dadurch konnten wir die Ladezeit um über 40% reduzieren und die Fehlerrate bei Fehleingaben vollständig eliminieren.`;

  return {
    totalScore,
    rating: totalScore >= 80 ? "Hervorragend" : totalScore >= 60 ? "Solide" : "Ausbaufähig",
    dimensions,
    strengths,
    improvements,
    improvedSampleAnswer,
  };
}
