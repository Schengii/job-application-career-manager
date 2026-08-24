// -----------------------------------------------------------------------------
// Mock-Interview Auswertungs-Engine
// -----------------------------------------------------------------------------
// Analysiert Antworten aus simulierten Vorstellungsgesprächen auf
// Fachbegriffe, Vollständigkeit, Struktur und Verständlichkeit.
// -----------------------------------------------------------------------------
import { InterviewQuestion } from "./interviewGuide";

export type AnswerEvaluation = {
  score: number; // 0 bis 100
  rating: "AUSGEZEICHNET" | "GUT" | "VERBESSERUNGSWÜRDIG" | "UNVOLLSTÄNDIG";
  matchedKeywords: string[];
  missingKeywords: string[];
  feedback: string[];
  tips?: string;
};

export function evaluateInterviewAnswer(
  question: InterviewQuestion,
  userAnswer: string
): AnswerEvaluation {
  const cleanAnswer = userAnswer.trim().toLowerCase();
  const feedback: string[] = [];

  if (cleanAnswer.length < 20) {
    return {
      score: 15,
      rating: "UNVOLLSTÄNDIG",
      matchedKeywords: [],
      missingKeywords: question.keywords,
      feedback: ["Die Antwort ist sehr kurz. Versuche, deine Gedanken ausführlicher und mit Beispielen aus der Praxis zu begründen."],
      tips: question.tips || question.answerSummary,
    };
  }

  // 1. Keyword-Matching (unterstützt exakte Phrasen und Kernwörter)
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of question.keywords) {
    const kwLower = kw.toLowerCase();
    const parts = kwLower.split(/[\s,.-]+/).filter((p) => p.length > 2);
    if (cleanAnswer.includes(kwLower) || (parts.length > 0 && parts.every((p) => cleanAnswer.includes(p)))) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const keywordRatio =
    question.keywords.length > 0
      ? matchedKeywords.length / question.keywords.length
      : 0.8;

  // 2. Längen- und Strukturanalyse
  let lengthPoints = 0;
  if (userAnswer.length >= 150) {
    lengthPoints = 30;
    feedback.push("Gute Antwortlänge und Detailtiefe.");
  } else if (userAnswer.length >= 70) {
    lengthPoints = 20;
    feedback.push("Prägnante Antwort.");
  } else {
    lengthPoints = 10;
    feedback.push("Etwas knapp formuliert. Gehe noch tiefer auf die technischen Hintergründe ein.");
  }

  // 3. Keyword-Punkte (max 50) + Basis-Punkte (15)
  const basePoints = 15;
  const keywordPoints = Math.round(keywordRatio * 45);

  // 4. Praxis-Erwähnung (z. B. 'projekt', 'erfahrung', 'umsetzung', 'code', 'genutzt', 'eingesetzt')
  const practicalBonus =
    cleanAnswer.includes("projekt") ||
    cleanAnswer.includes("erfahrung") ||
    cleanAnswer.includes("beispiel") ||
    cleanAnswer.includes("anwendung") ||
    cleanAnswer.includes("genutzt") ||
    cleanAnswer.includes("eingesetzt")
      ? 10
      : 0;

  if (practicalBonus > 0) {
    feedback.push("Starker Praxisbezug mit Nennung von Beispielen oder Projekten.");
  }

  const rawScore = Math.min(100, Math.max(0, basePoints + keywordPoints + lengthPoints + practicalBonus));

  if (matchedKeywords.length > 0) {
    feedback.push(`Wichtige Fachbegriffe genannt: ${matchedKeywords.join(", ")}.`);
  }

  if (missingKeywords.length > 0) {
    feedback.push(`Mögliche Ergänzungen: ${missingKeywords.slice(0, 3).join(", ")}.`);
  }

  let rating: AnswerEvaluation["rating"] = "UNVOLLSTÄNDIG";
  if (rawScore >= 70) rating = "AUSGEZEICHNET";
  else if (rawScore >= 50) rating = "GUT";
  else if (rawScore >= 30) rating = "VERBESSERUNGSWÜRDIG";

  return {
    score: rawScore,
    rating,
    matchedKeywords,
    missingKeywords,
    feedback,
    tips: question.tips || `Leitfaden: ${question.answerSummary}`,
  };
}
