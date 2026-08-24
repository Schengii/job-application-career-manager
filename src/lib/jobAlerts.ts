// -----------------------------------------------------------------------------
// Job-Alerts & Match-Radar Engine
// -----------------------------------------------------------------------------

export interface JobAlertCriteria {
  minScore: number;
  locationFilter: string; // "ALL" | "BONN_KOELN" | "RUHRGEBIET" | "REMOTE"
  minSalary: number;
  keywords: string[];
}

export interface JobAlertMatch {
  id: string;
  title: string;
  companyName: string;
  location: string;
  salaryInfo: string;
  matchScore: number;
  techStack: string;
  portalSource: string;
}

export interface JobAlertDigest {
  totalMatches: number;
  topMatches: JobAlertMatch[];
  digestSubject: string;
  summaryText: string;
  generatedAt: string;
}

export const DEFAULT_ALERT_CRITERIA: JobAlertCriteria = {
  minScore: 70,
  locationFilter: "ALL",
  minSalary: 40000,
  keywords: ["react", "typescript", "frontend"],
};

export function evaluateJobAlerts(
  jobs: {
    id: string;
    title: string;
    location: string | null;
    remote: boolean;
    salaryInfo: string | null;
    matchScore: number | null;
    techStack: string | null;
    portalSource: string;
    company?: { name: string } | null;
  }[],
  criteria: JobAlertCriteria = DEFAULT_ALERT_CRITERIA
): JobAlertDigest {
  const matches: JobAlertMatch[] = [];

  for (const job of jobs) {
    const score = job.matchScore || 0;
    if (score < criteria.minScore) continue;

    const loc = (job.location || "").toLowerCase();
    if (criteria.locationFilter === "REMOTE" && !job.remote && !loc.includes("remote")) {
      continue;
    }
    if (criteria.locationFilter === "BONN_KOELN" && !loc.includes("bonn") && !loc.includes("köln") && !loc.includes("remote")) {
      continue;
    }
    if (criteria.locationFilter === "RUHRGEBIET" && !loc.includes("dortmund") && !loc.includes("essen") && !loc.includes("bochum") && !loc.includes("remote")) {
      continue;
    }

    // Keyword Filter
    if (criteria.keywords.length > 0) {
      const combined = `${job.title} ${job.techStack || ""}`.toLowerCase();
      const hasKeyword = criteria.keywords.some((k) => combined.includes(k.toLowerCase()));
      if (!hasKeyword) continue;
    }

    matches.push({
      id: job.id,
      title: job.title,
      companyName: job.company?.name || "Unternehmen",
      location: job.location || "NRW",
      salaryInfo: job.salaryInfo || "Marktüblich",
      matchScore: score,
      techStack: job.techStack || "",
      portalSource: job.portalSource,
    });
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);

  const topMatches = matches.slice(0, 5);
  const now = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const digestSubject = `🔔 Job-Radar (${now}): ${matches.length} neue Top-Matches gefunden!`;
  const summaryText =
    matches.length > 0
      ? `Es wurden ${matches.length} Stellenangebote mit einem Match-Score von mindestens ${criteria.minScore}% ermittelt.`
      : `Aktuell keine Stellen, die allen Filterkriterien (Score ≥ ${criteria.minScore}%) entsprechen.`;

  return {
    totalMatches: matches.length,
    topMatches,
    digestSubject,
    summaryText,
    generatedAt: new Date().toISOString(),
  };
}
