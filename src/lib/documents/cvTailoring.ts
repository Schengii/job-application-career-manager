// -----------------------------------------------------------------------------
// CV Tailoring & Re-Ranking Logik pro Stellenangebot
// -----------------------------------------------------------------------------
import type { PreferencesWithProfile } from "@/types";

export interface TailoringResult {
  tailoredTechStack: string[];
  reorderedProjectIds: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  matchScorePct: number;
}

/**
 * Normalisiert einen Suchbegriff für flexiblen Wortabgleich.
 */
function normalizeKeyword(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Sortiert die Tech-Skills und Projekte des Nutzers so um, dass die
 * am besten zur Stellenanzeige passenden Anforderungen an erster Stelle stehen.
 */
export function tailorCvToJob(
  preferences: PreferencesWithProfile,
  jobRequirements: {
    targetPosition?: string;
    targetTechStack?: string | null;
    targetDescription?: string | null;
  }
): TailoringResult {
  const jobText = [
    jobRequirements.targetPosition,
    jobRequirements.targetTechStack,
    jobRequirements.targetDescription,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const normalizedJobText = normalizeKeyword(jobText);

  const userSkills = preferences.techStack
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  // Re-Ranking der Skills: Passende Skills wandern nach ganz vorne
  const matchedSkills: string[] = [];
  const otherSkills: string[] = [];

  for (const skill of userSkills) {
    const norm = normalizeKeyword(skill);
    // Exakter Teilabgleich oder Wortabgleich
    if (norm && (normalizedJobText.includes(norm) || jobText.includes(skill.toLowerCase()))) {
      matchedSkills.push(skill);
      matchedKeywords.push(skill);
    } else {
      otherSkills.push(skill);
    }
  }

  // Suche nach geforderten Keywords aus dem Job, die der Nutzer nicht explizit hat
  if (jobRequirements.targetTechStack) {
    const reqTokens = jobRequirements.targetTechStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const req of reqTokens) {
      const normReq = normalizeKeyword(req);
      const hasSkill = userSkills.some((s) => normalizeKeyword(s) === normReq);
      if (!hasSkill && !missingKeywords.includes(req)) {
        missingKeywords.push(req);
      }
    }
  }

  const tailoredTechStack = [...matchedSkills, ...otherSkills];

  // Re-Ranking der Projekte: Berechne Match-Punkte je Projekt
  const scoredProjects = preferences.projectEntries.map((proj) => {
    let score = 0;
    const projText = [proj.title, proj.description, proj.techStack].filter(Boolean).join(" ").toLowerCase();

    for (const kw of matchedKeywords) {
      if (projText.includes(normalizeKeyword(kw))) {
        score += 2;
      }
    }

    return { id: proj.id, score, originalOrder: proj.sortOrder };
  });

  // Nach Score absteigend sortieren, bei Gleichstand nach Original-Sortierung
  scoredProjects.sort((a, b) => b.score - a.score || a.originalOrder - b.originalOrder);

  const reorderedProjectIds = scoredProjects.map((p) => p.id);

  // Match-Score berechnen
  const totalKeywords = matchedKeywords.length + missingKeywords.length;
  const matchScorePct =
    totalKeywords > 0 ? Math.round((matchedKeywords.length / totalKeywords) * 100) : 100;

  return {
    tailoredTechStack,
    reorderedProjectIds,
    matchedKeywords,
    missingKeywords,
    matchScorePct,
  };
}
