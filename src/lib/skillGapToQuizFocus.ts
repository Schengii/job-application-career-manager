// -----------------------------------------------------------------------------
// Skill-Gap ➔ Interview-Quiz Brücke
// -----------------------------------------------------------------------------
// Verknüpft die Ergebnisse der Skill-Gap-Matrix (skillGapAnalyzer.ts) mit dem
// Tech-Quiz-Fragenkatalog (techQuizEngine.ts): Für jede fehlende, stark
// nachgefragte Skill wird geprüft, ob der Fragenkatalog passende Fragen bereithält.
// Nur dann wird eine Übungsempfehlung angezeigt (keine Vorschläge ins Leere).
// -----------------------------------------------------------------------------
import { SkillGapItem } from "./skillGapAnalyzer";
import { TECH_QUIZ_QUESTIONS, TechQuizQuestion, getQuestionsBySkills } from "./techQuizEngine";

export interface QuizFocusRecommendation {
  skill: string;
  priority: SkillGapItem["priority"];
  marketDemandPercentage: number;
  questionCount: number;
  questions: TechQuizQuestion[];
}

/**
 * Leitet aus den fehlenden High/Medium-Demand-Skills der Skill-Gap-Analyse
 * konkrete Quiz-Übungsempfehlungen ab. Es werden nur Skills berücksichtigt,
 * zu denen tatsächlich Fragen im Katalog existieren.
 */
export function getQuizFocusRecommendations(
  highDemandMissing: SkillGapItem[],
  questions: TechQuizQuestion[] = TECH_QUIZ_QUESTIONS,
  limit = 3
): QuizFocusRecommendation[] {
  const recommendations: QuizFocusRecommendation[] = [];

  for (const gap of highDemandMissing) {
    const matched = getQuestionsBySkills([gap.skill], questions);
    if (matched.length === 0) continue;

    recommendations.push({
      skill: gap.skill,
      priority: gap.priority,
      marketDemandPercentage: gap.marketDemandPercentage,
      questionCount: matched.length,
      questions: matched,
    });

    if (recommendations.length >= limit) break;
  }

  return recommendations;
}
