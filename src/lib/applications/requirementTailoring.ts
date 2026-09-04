// -----------------------------------------------------------------------------
// Requirement-Matching & Tailoring Engine ("Gap-to-Pitch")
// -----------------------------------------------------------------------------
// Gleicht konkrete Anforderungen einer Stellenanzeige mit dem Bewerberprofil ab
// und generiert maßgeschneiderte Pitch-Argumente und Anschreiben-Absätze.
// -----------------------------------------------------------------------------

export type RequirementItem = {
  requirement: string;
  category: "TECH_STACK" | "EXPERIENCE" | "METHODOLOGY" | "SOFT_SKILL";
  status: "MATCHED" | "PARTIAL" | "GAP";
  evidence?: string;
  pitchBullet: string;
};

export type TailoringResult = {
  overallMatchScore: number; // 0-100%
  requirements: RequirementItem[];
  tailoredOpeningPitch: string;
  recommendedCoverLetterParagraph: string;
  missingKeywordsToLearn: string[];
};

export type JobInput = {
  title: string;
  description?: string | null;
  requirementsProfile?: string | null;
  techStack?: string | null;
};

export type ProfileInput = {
  fullName?: string | null;
  desiredRole?: string | null;
  techStack: string;
  profileSummary?: string | null;
  projects?: Array<{
    title: string;
    description?: string | null;
    techStack?: string | null;
  }>;
  educations?: Array<{
    title: string;
    institution?: string | null;
  }>;
};

/**
 * Extrahiert Kern-Keywords aus der Stellenanzeige und den Anforderungsfeldern.
 */
function extractJobKeywords(job: JobInput): string[] {
  const text = [
    job.title,
    job.techStack || "",
    job.requirementsProfile || "",
    job.description || "",
  ].join(" ");

  const detected = new Set<string>();

  // Gängige Tech-Stack Keywords
  const knownTech = [
    "TypeScript", "JavaScript", "React", "Next.js", "Vue", "Angular",
    "Node.js", "HTML5", "CSS3", "Tailwind", "REST", "GraphQL", "Git",
    "Docker", "CI/CD", "Testing", "Jest", "Vitest", "Playwright", "Redux",
    "Zustand", "SQLite", "PostgreSQL", "Prisma", "Sass", "Responsive Design",
    "Accessibility", "a11y", "Agile", "Scrum", "Clean Code"
  ];

  for (const tech of knownTech) {
    const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(text)) {
      detected.add(tech);
    }
  }

  // Zusätzliche kommaseparierte Werte aus techStack
  if (job.techStack) {
    job.techStack
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 1)
      .forEach((t) => detected.add(t));
  }

  return Array.from(detected);
}

/**
 * Führt den deterministischen Regel- und Pattern-Abgleich durch.
 */
export function analyzeAndTailorRequirements(job: JobInput, profile: ProfileInput): TailoringResult {
  const userSkills = profile.techStack
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const jobKeywords = extractJobKeywords(job);
  const requirements: RequirementItem[] = [];
  const missingKeywords: string[] = [];

  let matchedCount = 0;

  for (const kw of jobKeywords) {
    const kwLower = kw.toLowerCase();
    const isDirectSkill = userSkills.some((s) => s.includes(kwLower) || kwLower.includes(s));

    // Projekt-Evidenz prüfen
    const matchingProject = profile.projects?.find((p) => {
      const pText = `${p.title} ${p.techStack || ""} ${p.description || ""}`.toLowerCase();
      return pText.includes(kwLower);
    });

    if (isDirectSkill || matchingProject) {
      matchedCount++;
      const evidence = matchingProject
        ? `Praktisch angewendet im Projekt „${matchingProject.title}“ (${matchingProject.techStack || kw})`
        : `Verankert im Kern-Tech-Stack`;

      requirements.push({
        requirement: kw,
        category: ["Git", "Agile", "Scrum", "CI/CD"].includes(kw) ? "METHODOLOGY" : "TECH_STACK",
        status: "MATCHED",
        evidence,
        pitchBullet: `Fundierte Praxiserfahrung in ${kw}: ${evidence}.`,
      });
    } else {
      missingKeywords.push(kw);
      requirements.push({
        requirement: kw,
        category: "TECH_STACK",
        status: "GAP",
        evidence: undefined,
        pitchBullet: `Schnelle Einarbeitung in ${kw} basierend auf solider ${profile.techStack.split(",")[0] || "Frontend"}-Basis.`,
      });
    }
  }

  const total = Math.max(jobKeywords.length, 1);
  const matchScore = Math.min(100, Math.round((matchedCount / total) * 100));

  // Generiere maßgeschneiderte Absätze
  const matchedKeywordsList = requirements
    .filter((r) => r.status === "MATCHED")
    .map((r) => r.requirement)
    .slice(0, 4)
    .join(", ");

  const topProject = profile.projects?.[0];
  const projectMention = topProject
    ? `wie ich u. a. bei der Konzeption und Umsetzung meines Projekts „${topProject.title}“ (${topProject.techStack || "Frontend-Architektur"}) unter Beweis gestellt habe.`
    : `die ich zielgerichtet und lösungsorientiert in Ihre Entwicklungsprozesse einbringe.`;

  const tailoredOpeningPitch = `Als ${profile.desiredRole || "Entwickler"} bringe ich genau das geforderte Profil für ${job.title} mit – insbesondere im Hinblick auf ${matchedKeywordsList || profile.techStack}.`;

  const recommendedCoverLetterParagraph = `Mit den von Ihnen geforderten Kerntechnologien (${matchedKeywordsList || "modernes Frontend"}) bin ich bestens vertraut. Meine Schwerpunkte liegen in der strukturierten Entwicklung robuster, performanter Web-Anwendungen, ${projectMention}`;

  return {
    overallMatchScore: matchScore,
    requirements,
    tailoredOpeningPitch,
    recommendedCoverLetterParagraph,
    missingKeywordsToLearn: missingKeywords,
  };
}
