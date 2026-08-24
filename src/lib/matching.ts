// -----------------------------------------------------------------------------
// Matching-Engine: berechnet einen Prozent-Score, wie gut ein Stellenangebot
// zu den in der Datenbank hinterlegten Präferenzen passt.
// -----------------------------------------------------------------------------
// Gewichtung:
//   50% Tech-Stack-Überschneidung (z.B. TypeScript, React, CSS ...)
//   25% Standort-/Remote-Übereinstimmung
//   15% Rollen-/Titel-Keyword-Treffer (z.B. "Frontend", "Fachinformatiker")
//   10% Bonus für explizit im Anforderungsprofil genannte Präferenz-Skills
// -----------------------------------------------------------------------------

export type MatchInput = {
  job: {
    title: string;
    description: string;
    location?: string | null;
    remote: boolean;
    requirementsProfile?: string | null;
    techStack?: string | null;
  };
  preferences: {
    techStack: string;
    preferredLocations: string;
    remotePreference: string; // ONSITE | HYBRID | REMOTE | ANY
    desiredRole: string;
  };
};

// Deutsche Füllwörter, die bei der Rollen-Keyword-Analyse ignoriert werden,
// damit z.B. "Fachinformatiker FÜR Anwendungsentwicklung" nicht an einem
// fehlenden "für" im Stellentitel scheitert.
const STOPWORDS = new Set([
  "für",
  "und",
  "der",
  "die",
  "das",
  "des",
  "dem",
  "den",
  "mit",
  "im",
  "in",
  "am",
  "an",
  "als",
  "von",
  "zur",
  "zum",
]);

function toKeywordList(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

/** Zerlegt einen Freitext (z.B. "Fachinformatiker für Anwendungsentwicklung") in
 *  einzelne, aussagekräftige Wörter statt ihn als einen einzigen langen
 *  Suchstring zu behandeln – sonst scheitert der Treffer schon an einem
 *  einzigen fehlenden Füllwort im Stellentitel. */
function toRoleKeywords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[()/]/g, " ")
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function computeMatchScore({ job, preferences }: MatchInput): number {
  const prefTech = toKeywordList(preferences.techStack);
  const jobTech = toKeywordList(job.techStack);
  const haystack = `${job.title} ${job.description} ${job.requirementsProfile ?? ""}`.toLowerCase();

  // 1) Tech-Stack-Überschneidung: wie viele Präferenz-Skills tauchen im Job
  //    (Tech-Stack-Feld ODER im Freitext) auf?
  let techHits = 0;
  for (const skill of prefTech) {
    if (jobTech.includes(skill) || haystack.includes(skill)) techHits++;
  }
  const techScore = prefTech.length > 0 ? techHits / prefTech.length : 0;

  // 2) Standort / Remote
  const preferredLocations = toKeywordList(preferences.preferredLocations);
  const jobLocation = (job.location ?? "").toLowerCase();
  let locationScore = 0;
  if (job.remote && (preferences.remotePreference === "REMOTE" || preferences.remotePreference === "ANY" || preferences.remotePreference === "HYBRID")) {
    locationScore = 1;
  } else if (preferredLocations.some((loc) => jobLocation.includes(loc))) {
    locationScore = 1;
  } else if (preferences.remotePreference === "ANY") {
    locationScore = 0.5;
  }

  // 3) Rollen-Keywords aus der gewünschten Rolle (z.B. "Fachinformatiker",
  //    "Anwendungsentwicklung"), wortweise statt als ein langer Suchstring
  const roleKeywords = toRoleKeywords(preferences.desiredRole);
  const roleHits = roleKeywords.filter((kw) => haystack.includes(kw)).length;
  const roleScore = roleKeywords.length > 0 ? roleHits / roleKeywords.length : 0;

  const total = techScore * 0.5 + locationScore * 0.25 + roleScore * 0.15 + (techHits > 0 ? 0.1 : 0);

  return Math.round(Math.min(1, total) * 100);
}
