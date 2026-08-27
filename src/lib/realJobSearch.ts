// -----------------------------------------------------------------------------
// Echte Live-Jobsuche: Bundesagentur für Arbeit API & Arbeitnow API
// -----------------------------------------------------------------------------
// Response-Cache: identische Suchanfragen (z.B. mehrfaches Klicken, ein neu
// geöffneter Tab mit denselben Filtern) lösen innerhalb der TTL keinen
// erneuten externen API-Aufruf aus — spart unnötige Requests gegen die
// Bundesagentur-/Arbeitnow-APIs und macht wiederholte Suchen spürbar
// schneller. In-memory, modul-weit einmal angelegt (dasselbe Idiom wie der
// Rate-Limiter in src/lib/rateLimiter.ts: ein einziger Server-Prozess für
// diese Single-User-App, kein verteilter Cache nötig).
import { SimulatedJobPosting } from "./mockJobPortals";

export interface LiveJobSearchParams {
  query?: string;
  location?: string;
  radius?: number; // km
  source?: "ALL" | "ARBEITSAGENTUR" | "ARBEITNOW";
  limit?: number;
}

export interface LiveJobSearchResult {
  jobs: SimulatedJobPosting[];
  totalFound: number;
  sourcesQueried: string[];
  isFallback: boolean;
}

// Extrahiert typische Web-Tech-Keywords aus Anzeigentexten
export function extractTechKeywordsFromText(text: string): string[] {
  const TECH_KEYWORDS = [
    "TypeScript", "JavaScript", "React", "Next.js", "Vue", "Angular",
    "Node.js", "Express", "Tailwind", "CSS", "HTML", "Sass", "SCSS",
    "REST", "GraphQL", "Prisma", "PostgreSQL", "MySQL", "SQLite", "MongoDB",
    "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "CI/CD", "Vitest", "Jest",
    "Python", "Java", "C#", ".NET", "PHP", "AWS", "Azure", "GCP", "Linux",
    "Figma", "Redux", "Zustand", "Webpack", "Vite", "Turbopack", "A11y"
  ];

  const lower = text.toLowerCase();
  const matched = new Set<string>();

  for (const tech of TECH_KEYWORDS) {
    // Regex für exakte Wortgrenzen
    const regex = new RegExp(`\\b${tech.replace(".", "\\.")}\\b`, "i");
    if (regex.test(lower)) {
      matched.add(tech);
    }
  }

  // Falls leer, Standard-Webstack für Frontend
  if (matched.size === 0) {
    return ["TypeScript", "JavaScript", "React", "CSS", "HTML"];
  }

  return Array.from(matched);
}

/**
 * Ruft Stellenangebote über die Arbeitnow API (öffentliche europäische Tech-Jobs API) ab.
 */
export async function searchArbeitnow(params: LiveJobSearchParams): Promise<SimulatedJobPosting[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data || !Array.isArray(data.data)) return [];

    const q = (params.query || "developer").toLowerCase();
    const loc = (params.location || "").toLowerCase();

    const filtered = data.data.filter((item: Record<string, unknown>) => {
      const title = String(item.title || "").toLowerCase();
      const location = String(item.location || "").toLowerCase();
      const isRemote = Boolean(item.remote);

      const matchesQuery = title.includes("developer") || title.includes("software") || title.includes("frontend") || title.includes("web") || title.includes(q);
      const matchesLoc = !loc || location.includes(loc) || isRemote;

      return matchesQuery && matchesLoc;
    });

    return filtered.slice(0, params.limit || 15).map((item: Record<string, unknown>) => {
      const title = String(item.title || "Softwareentwickler");
      const desc = String(item.description || "").replace(/<[^>]*>?/gm, " ");
      const companyName = String(item.company_name || "Tech Unternehmen");
      const location = String(item.location || "Deutschland / Remote");
      const isRemote = Boolean(item.remote);
      const url = String(item.url || "");
      const tags = Array.isArray(item.tags) ? item.tags.join(",") : "";

      const techStack = tags ? tags : extractTechKeywordsFromText(title + " " + desc).join(",");

      return {
        title,
        description: desc.slice(0, 1200),
        portalSource: "ARBEITNOW",
        sourceUrl: url || `https://www.arbeitnow.com/jobs/${companyName.toLowerCase().replace(/\s+/g, "-")}`,
        location,
        remote: isRemote,
        requirementsProfile: `Geforderter Tech-Stack: ${techStack}. Fundierte Kenntnisse in moderner Software- und Webentwicklung.`,
        techStack,
        salaryInfo: "Marktüblich nach Vereinbarung (ca. 45.000 € - 60.000 €)",
        companyName,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Ruft Stellenangebote über die offizielle Bundesagentur für Arbeit API ab.
 */
export async function searchArbeitsagentur(params: LiveJobSearchParams): Promise<SimulatedJobPosting[]> {
  try {
    const query = encodeURIComponent(params.query || "Fachinformatiker Anwendungsentwicklung");
    const location = encodeURIComponent(params.location || "Bonn");
    const radius = params.radius || 50;

    const url = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?was=${query}&wo=${location}&umkreis=${radius}&size=${params.limit || 15}&page=1`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-API-Key": "jobboerse-jobsuche",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data || !Array.isArray(data.stellenangebote)) return [];

    return data.stellenangebote.map((item: Record<string, unknown>) => {
      const title = String(item.beruf || item.titel || "Fachinformatiker Anwendungsentwicklung");
      const companyName = String(item.arbeitgeber || "IT-Unternehmen Region");
      const jobLocation = String((item.arbeitsort as { ort?: string })?.ort || params.location || "NRW");
      const refnr = String(item.refnr || "");
      const isRemote = title.toLowerCase().includes("remote") || title.toLowerCase().includes("homeoffice");

      const techStack = extractTechKeywordsFromText(title).join(",");

      return {
        title,
        description: `Stellenangebot über die Bundesagentur für Arbeit (Ref-Nr: ${refnr}). Position als ${title} bei ${companyName} im Raum ${jobLocation}.`,
        portalSource: "ARBEITSAGENTUR",
        sourceUrl: `https://www.arbeitsagentur.de/jobsuche/jobdetail/${refnr}`,
        location: jobLocation,
        remote: isRemote,
        requirementsProfile: `Fachinformatiker für Anwendungsentwicklung oder vergleichbare Qualifikation. Schwerpunkte: ${techStack}.`,
        techStack,
        salaryInfo: "Tariflich / Marktüblich nach Vereinbarung",
        companyName,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fallback-Generator für Offline-Umgebungen
 */
function generateLiveFallbackJobs(params: LiveJobSearchParams): SimulatedJobPosting[] {
  const loc = params.location || "Bonn / Dortmund";
  return [
    {
      title: "Frontend Entwickler (m/w/d) React / TypeScript",
      description: "Verstärkung für unser agiles Web-Team gesucht. Entwicklung moderner Next.js / React Enterprise Anwendungen.",
      portalSource: "STEPSTONE",
      sourceUrl: "https://www.stepstone.de/stellenangebote/frontend-developer",
      location: loc,
      remote: true,
      requirementsProfile: "Erfahrung mit React, TypeScript, CSS3, Tailwind und REST-Schnittstellen. Ausbildung als Fachinformatiker.",
      techStack: "TypeScript,React,Next.js,Tailwind,REST",
      salaryInfo: "48.000 € - 58.000 €",
      companyName: "Trivago & Partner Solutions",
    },
    {
      title: "Fachinformatiker Anwendungsentwicklung (m/w/d) Web Apps",
      description: "Spannende Web-Projekte für den öffentlichen Sektor und Mittelstand in NRW. Fokus auf sauberen Code und Barrierefreiheit.",
      portalSource: "ARBEITSAGENTUR",
      sourceUrl: "https://www.arbeitsagentur.de/jobsuche",
      location: loc,
      remote: false,
      requirementsProfile: "Gute Kenntnisse in JavaScript, HTML5, CSS und modernen Komponenten-Bibliotheken.",
      techStack: "JavaScript,TypeScript,React,CSS,Git",
      salaryInfo: "44.000 € - 52.000 €",
      companyName: "Rhein-Ruhr Digitalagentur GmbH",
    },
    {
      title: "Junior Fullstack Developer (m/w/d) TypeScript & Node.js",
      description: "Entwicklung von Cloud-basierten SaaS-Lösungen mit modernem Tech-Stack in einem dynamischen Entwicklerteam.",
      portalSource: "GETINIT",
      sourceUrl: "https://www.get-in-it.de",
      location: "Remote / Köln",
      remote: true,
      requirementsProfile: "Solide Basis in Webtechnologien, Motivation zum kontinuierlichen Lernen.",
      techStack: "TypeScript,React,Node.js,PostgreSQL,Docker",
      salaryInfo: "46.000 € - 54.000 €",
      companyName: "CloudTech NRW Solutions",
    },
  ];
}

const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minuten
// Obergrenze für die Anzahl gleichzeitig vorgehaltener Suchanfragen — schützt
// vor unbegrenztem Speicherwachstum, falls sehr viele unterschiedliche
// Filterkombinationen durchprobiert werden. Bei Erreichen wird der älteste
// Eintrag verdrängt (FIFO), analog zu `maxTrackedKeys` in rateLimiter.ts.
const SEARCH_CACHE_MAX_ENTRIES = 200;

type CacheEntry = { result: LiveJobSearchResult; expiresAt: number };
const searchCache = new Map<string, CacheEntry>();

function cacheKeyFor(params: LiveJobSearchParams): string {
  return JSON.stringify({
    query: params.query ?? "",
    location: params.location ?? "",
    radius: params.radius ?? null,
    source: params.source ?? "ALL",
    limit: params.limit ?? 20,
  });
}

async function searchRealJobsUncached(params: LiveJobSearchParams): Promise<LiveJobSearchResult> {
  const sourcesQueried: string[] = [];
  const results: SimulatedJobPosting[] = [];

  const source = params.source || "ALL";

  if (source === "ALL" || source === "ARBEITSAGENTUR") {
    sourcesQueried.push("Bundesagentur für Arbeit");
    const baJobs = await searchArbeitsagentur(params);
    results.push(...baJobs);
  }

  if (source === "ALL" || source === "ARBEITNOW") {
    sourcesQueried.push("Arbeitnow Tech Jobs API");
    const anJobs = await searchArbeitnow(params);
    results.push(...anJobs);
  }

  if (results.length === 0) {
    const fallback = generateLiveFallbackJobs(params);
    return {
      jobs: fallback,
      totalFound: fallback.length,
      sourcesQueried,
      isFallback: true,
    };
  }

  return {
    jobs: results.slice(0, params.limit || 20),
    totalFound: results.length,
    sourcesQueried,
    isFallback: false,
  };
}

/**
 * Hauptsuchfunktion: Aggregiert Ergebnisse aus allen Quellen. Identische
 * Anfragen (gleiche query/location/radius/source/limit) werden für
 * `SEARCH_CACHE_TTL_MS` aus dem In-Memory-Cache beantwortet, statt erneut
 * die externen Job-Portal-APIs abzufragen.
 */
export async function searchRealJobs(params: LiveJobSearchParams): Promise<LiveJobSearchResult> {
  const key = cacheKeyFor(params);
  const cached = searchCache.get(key);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.result;
  }

  const result = await searchRealJobsUncached(params);

  if (searchCache.size >= SEARCH_CACHE_MAX_ENTRIES && !searchCache.has(key)) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey !== undefined) searchCache.delete(oldestKey);
  }
  searchCache.set(key, { result, expiresAt: now + SEARCH_CACHE_TTL_MS });

  return result;
}

/** Nur für Tests: leert den Suchergebnis-Cache zwischen Testfällen. */
export function clearSearchCache(): void {
  searchCache.clear();
}
