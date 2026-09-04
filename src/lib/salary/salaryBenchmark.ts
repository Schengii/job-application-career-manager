// -----------------------------------------------------------------------------
// Gehalts-Benchmarking & Marktvergleich für Fachinformatiker Anwendungsentwicklung
// Schwerpunkt: Frontend-Entwicklung (TypeScript, React, Next.js, UI/UX)
// -----------------------------------------------------------------------------

export type Region = "NRW_BONN_KOELN" | "NRW_RUHRGEBIET" | "REMOTE" | "BERLIN" | "MUENCHEN" | "DEUTSCHLAND_SCHNITT";

export type ExperienceLevel = "JUNIOR_ENTRY" | "MID_LEVEL" | "SENIOR";

export interface SalaryBenchmark {
  role: string;
  region: Region;
  regionLabel: string;
  experienceLevel: ExperienceLevel;
  experienceLabel: string;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  userTargetSalary?: number;
  userTargetVsMedianPercent?: number;
  negotiationTips: string[];
}

const REGION_FACTORS: Record<Region, { factor: number; label: string }> = {
  NRW_BONN_KOELN: { factor: 1.02, label: "NRW (Bonn / Köln / Düsseldorf)" },
  NRW_RUHRGEBIET: { factor: 0.98, label: "NRW (Dortmund / Ruhrgebiet)" },
  REMOTE: { factor: 1.0, label: "Vollständig Remote (Deutschlandweit)" },
  BERLIN: { factor: 0.98, label: "Berlin" },
  MUENCHEN: { factor: 1.15, label: "München / Bayern" },
  DEUTSCHLAND_SCHNITT: { factor: 1.0, label: "Deutschlandweiter Durchschnitt" },
};

const BASE_SALARIES: Record<ExperienceLevel, { p25: number; median: number; p75: number; p90: number; label: string }> = {
  JUNIOR_ENTRY: {
    p25: 42000,
    median: 46000,
    p75: 50000,
    p90: 54000,
    label: "Berufseinsteiger / Nach Umschulung (0–2 Jahre)",
  },
  MID_LEVEL: {
    p25: 49000,
    median: 55000,
    p75: 62000,
    p90: 68000,
    label: "Professional / Mid-Level (2–5 Jahre)",
  },
  SENIOR: {
    p25: 62000,
    median: 70000,
    p75: 78000,
    p90: 88000,
    label: "Senior Frontend Engineer (5+ Jahre)",
  },
};

const NEGOTIATION_TIPS: Record<ExperienceLevel, string[]> = {
  JUNIOR_ENTRY: [
    "Hebe praktische Praxiserfahrung aus deiner Umschulung und eigenen Projekten (z. B. electroCheck-ai) hervor.",
    "Betone moderne Technologien wie TypeScript, Next.js App Router und Clean Architecture, die viele Absolventen noch nicht beherrschen.",
    "Nutze Benefits als Gehaltshebel: 100% Home-Office-Ausstattung, Weiterbildungsbudget, Jobticket oder BAV.",
    "Vereinbare eine automatische Gehaltserhöhung nach erfolgreicher 6-monatiger Probezeit.",
  ],
  MID_LEVEL: [
    "Fokussiere dich auf messbaren Impact: schnellere Ladezeiten, geringere Fehlerraten durch Unit-Tests.",
    "Hebe Erfahrung in Code Reviews und Mentoring von Juniors hervor.",
    "Verhandle variable Bonuskomponenten und zusätzliche Urlaubstage (30 Tage als Standard).",
  ],
  SENIOR: [
    "Betone Architekturverantwortung, Technologie-Entscheidungen und CI/CD-Pipeline-Ownership.",
    "Verhandle Führungs- oder Fachexperten-Boni sowie flexible Arbeitszeitmodelle.",
  ],
};

export function calculateSalaryBenchmark(
  experienceLevel: ExperienceLevel = "JUNIOR_ENTRY",
  region: Region = "NRW_BONN_KOELN",
  userTargetSalary?: number
): SalaryBenchmark {
  const base = BASE_SALARIES[experienceLevel] || BASE_SALARIES.JUNIOR_ENTRY;
  const reg = REGION_FACTORS[region] || REGION_FACTORS.NRW_BONN_KOELN;

  const p25 = Math.round(base.p25 * reg.factor);
  const median = Math.round(base.median * reg.factor);
  const p75 = Math.round(base.p75 * reg.factor);
  const p90 = Math.round(base.p90 * reg.factor);

  let userTargetVsMedianPercent: number | undefined;
  if (userTargetSalary && userTargetSalary > 0) {
    userTargetVsMedianPercent = Math.round(((userTargetSalary - median) / median) * 100);
  }

  return {
    role: "Fachinformatiker Anwendungsentwicklung (Frontend / React / TypeScript)",
    region,
    regionLabel: reg.label,
    experienceLevel,
    experienceLabel: base.label,
    p25,
    median,
    p75,
    p90,
    userTargetSalary,
    userTargetVsMedianPercent,
    negotiationTips: NEGOTIATION_TIPS[experienceLevel],
  };
}
