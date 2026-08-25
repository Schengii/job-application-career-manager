// -----------------------------------------------------------------------------
// Erfolgsquoten nach Tag & Tech-Stack
// -----------------------------------------------------------------------------
// Wertet aus, welche Bewerbungs-Tags (z. B. "#Remote", "#Prio1") und welche
// Tech-Stack-Skills (aus der verknüpften Stellenanzeige) überdurchschnittlich
// oft zu einem Vorstellungsgespräch bzw. einer Zusage führen. Nützlich, um
// die eigene Bewerbungsstrategie datenbasiert zu schärfen (z. B. "Bewerbungen
// mit #Remote haben eine 40% höhere Einladungsquote als der Durchschnitt").
// -----------------------------------------------------------------------------
import { parseTags } from "./tags";

export type SkillSuccessRate = {
  skill: string;
  total: number;
  interviewCount: number;
  interviewRate: number;
  offerCount: number;
  offerRate: number;
};

export type ApplicationForSkillStats = {
  status: string;
  tags?: string | null;
  statusEvents: { status: string }[];
  jobPosting?: { techStack: string | null } | null;
};

/** Ab wie vielen Bewerbungen ein Tag/Skill statistisch aussagekräftig genug ist, um angezeigt zu werden. */
const MIN_SAMPLE_SIZE = 2;

function reachedInterview(app: ApplicationForSkillStats): boolean {
  return (
    app.status === "INTERVIEW" ||
    app.status === "OFFER" ||
    app.statusEvents.some((e) => e.status === "INTERVIEW")
  );
}

function aggregateBySkill(
  applications: ApplicationForSkillStats[],
  extractSkills: (app: ApplicationForSkillStats) => string[],
): SkillSuccessRate[] {
  const stats = new Map<string, { total: number; interview: number; offer: number }>();

  for (const app of applications) {
    // Set: Ein Skill, der z. B. doppelt in den Tags steht, zählt pro
    // Bewerbung nur einmal.
    const skills = new Set(extractSkills(app));
    const interview = reachedInterview(app);
    const offer = app.status === "OFFER";

    for (const skill of skills) {
      const entry = stats.get(skill) ?? { total: 0, interview: 0, offer: 0 };
      entry.total += 1;
      if (interview) entry.interview += 1;
      if (offer) entry.offer += 1;
      stats.set(skill, entry);
    }
  }

  return Array.from(stats.entries())
    .map(([skill, s]) => ({
      skill,
      total: s.total,
      interviewCount: s.interview,
      interviewRate: Math.round((s.interview / s.total) * 100),
      offerCount: s.offer,
      offerRate: Math.round((s.offer / s.total) * 100),
    }))
    .filter((s) => s.total >= MIN_SAMPLE_SIZE)
    .sort((a, b) => b.interviewRate - a.interviewRate || b.total - a.total);
}

/** Erfolgsquote je Bewerbungs-Tag (`Application.tags`). */
export function computeTagSuccessRates(applications: ApplicationForSkillStats[]): SkillSuccessRate[] {
  return aggregateBySkill(applications, (app) => parseTags(app.tags));
}

/** Erfolgsquote je Tech-Stack-Skill der verknüpften Stellenanzeige (`JobPosting.techStack`). */
export function computeTechStackSuccessRates(applications: ApplicationForSkillStats[]): SkillSuccessRate[] {
  return aggregateBySkill(applications, (app) => parseTags(app.jobPosting?.techStack));
}
