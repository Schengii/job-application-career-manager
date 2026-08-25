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

export type MatchWeights = {
  techWeight?: number; // default 0.5 (50%)
  locationWeight?: number; // default 0.25 (25%)
  roleWeight?: number; // default 0.15 (15%)
  bonusWeight?: number; // default 0.1 (10%)
};

export type MatchInput = {
  job: {
    title: string;
    description: string;
    location?: string | null;
    remote: boolean;
    requirementsProfile?: string | null;
    techStack?: string | null;
    company?: { name: string } | null;
    companyName?: string | null;
  };
  preferences: {
    techStack: string;
    preferredLocations: string;
    remotePreference: string; // ONSITE | HYBRID | REMOTE | ANY
    desiredRole: string;
    excludedCompanies?: string | null;
    excludedKeywords?: string | null;
    excludedTechStack?: string | null;
  };
  weights?: MatchWeights;
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

export function toKeywordList(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

/** Zerlegt einen Freitext (z.B. "Fachinformatiker für Anwendungsentwicklung") in
 *  einzelne, aussagekräftige Wörter statt ihn als einen einzigen langen
 *  Suchstring zu behandeln – sonst scheitert der Treffer schon an einem
 *  einzigen fehlenden Füllwort im Stellentitel. */
export function toRoleKeywords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[()/]/g, " ")
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Prüft, ob ein Unternehmensname in der Ausschluss-Liste (Blacklist) vorkommt. */
export function isCompanyExcluded(
  companyName: string | null | undefined,
  excludedCompanies: string | null | undefined
): boolean {
  if (!companyName?.trim() || !excludedCompanies?.trim()) return false;
  const name = companyName.trim().toLowerCase();
  const list = toKeywordList(excludedCompanies);
  return list.some((excluded) => name.includes(excluded) || excluded.includes(name));
}

/** Extrahiert häufige Senioritäts-, Rollen- und Tech-Kandidaten aus Jobtitel & Text für den Dismiss-Dialog. */
export function extractDismissalCandidates(job: {
  title: string;
  description: string;
  techStack?: string | null;
}): { keywords: string[]; tech: string[] } {
  const haystack = `${job.title} ${job.description}`.toLowerCase();
  const techList = toKeywordList(job.techStack);

  const candidateKeywords = [
    "senior",
    "lead",
    "principal",
    "architect",
    "architekt",
    "leitung",
    "manager",
    "junior",
    "trainee",
    "werkstudent",
    "praktikum",
    "zeitarbeit",
    "schichtarbeit",
    "vollzeit vor ort",
    "reisetätigkeit",
  ];

  const candidateTech = [
    "php",
    "wordpress",
    "typo3",
    "drupal",
    "java",
    "spring boot",
    "c#",
    ".net",
    "c++",
    "python",
    "django",
    "angular",
    "vue",
    "flutter",
    "swift",
    "kotlin",
    "rust",
    "go",
    "ruby",
    "cobol",
    "sap",
    "abap",
    "salesforce",
  ];

  const matchedKeywords = candidateKeywords.filter((kw) => haystack.includes(kw));
  const matchedTech = [
    ...new Set([
      ...techList,
      ...candidateTech.filter((t) => haystack.includes(t)),
    ]),
  ];

  return {
    keywords: matchedKeywords,
    tech: matchedTech,
  };
}

export function computeMatchScore({ job, preferences, weights }: MatchInput): number {
  const companyName = job.company?.name ?? job.companyName;
  if (isCompanyExcluded(companyName, preferences.excludedCompanies)) {
    return 0; // Blacklist-Ausschluss führt zu sofortigem 0%-Score
  }

  const wTech = weights?.techWeight ?? 0.5;
  const wLoc = weights?.locationWeight ?? 0.25;
  const wRole = weights?.roleWeight ?? 0.15;
  const wBonus = weights?.bonusWeight ?? 0.1;

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

  let total = techScore * wTech + locationScore * wLoc + roleScore * wRole + (techHits > 0 ? wBonus : 0);

  // 4) Negative Abzüge für ausgeschlossene Keywords & ausgeschlossene Technologien
  const excludedKeywords = toKeywordList(preferences.excludedKeywords);
  let negativeKeywordHits = 0;
  for (const negKw of excludedKeywords) {
    if (haystack.includes(negKw)) {
      negativeKeywordHits++;
    }
  }

  const excludedTech = toKeywordList(preferences.excludedTechStack);
  let negativeTechHits = 0;
  for (const negTech of excludedTech) {
    if (jobTech.includes(negTech) || haystack.includes(negTech)) {
      negativeTechHits++;
    }
  }

  // Jeder Treffer auf ein negatives Keyword oder unerwünschtes Tech-Element zieht 20% ab
  const penalty = (negativeKeywordHits * 0.25) + (negativeTechHits * 0.20);
  total = Math.max(0, total - penalty);

  return Math.round(Math.min(1, total) * 100);
}

