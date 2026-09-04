// -----------------------------------------------------------------------------
// Skill-Gap Matrix & Lern-Roadmap Generator
// -----------------------------------------------------------------------------
// Analysiert die Häufigkeit geforderter Technologien über alle gespeicherten
// Stellenanzeigen und vergleicht sie mit den Profil-Präferenzen des Bewerbers.
// -----------------------------------------------------------------------------
export interface SkillGapItem {
  skill: string;
  category: "FRONTEND" | "BACKEND" | "DEVOPS_TOOLS" | "ARCHITECTURE" | "OTHER";
  marketDemandCount: number;
  marketDemandPercentage: number; // 0 - 100%
  inUserProfile: boolean;
  priority: "HIGH" | "MEDIUM" | "LOW";
  learningRecommendation: string;
  resourceTip: string;
}

export interface SkillGapAnalysisResult {
  totalJobsAnalyzed: number;
  matchingSkillsCount: number;
  missingHighDemandSkillsCount: number;
  profileCoveragePercentage: number;
  topSkills: SkillGapItem[];
  highDemandMissing: SkillGapItem[];
  learningRoadmap: {
    immediateFocus: string[];
    mediumTermFocus: string[];
    niceToHave: string[];
  };
}

const SKILL_METADATA: Record<
  string,
  {
    category: SkillGapItem["category"];
    recommendation: string;
    resourceTip: string;
  }
> = {
  typescript: {
    category: "FRONTEND",
    recommendation: "Generics, Utility Types (Partial, Record) und Type Narrowing für sauberen Code.",
    resourceTip: "TypeScript Handbook & TotalTypeScript (Matt Pocock)",
  },
  react: {
    category: "FRONTEND",
    recommendation: "React 19 Server Components, Actions, useActionState und Custom Hooks.",
    resourceTip: "Offizielle React.dev Dokumentation",
  },
  "next.js": {
    category: "FRONTEND",
    recommendation: "App Router Architektur, Server vs. Client Components, SWR Caching & Turbopack.",
    resourceTip: "Next.js Learn & Next.js 16 App Router Docs",
  },
  tailwind: {
    category: "FRONTEND",
    recommendation: "Tailwind v4 CSS-first Konfiguration, responsive Breakpoints, Theme Tokens.",
    resourceTip: "tailwindcss.com Docs",
  },
  css: {
    category: "FRONTEND",
    recommendation: "Flexbox, CSS Grid, CSS Variables, A11y & Barrierefreiheit (WCAG).",
    resourceTip: "MDN Web Docs (CSS Layouts & Accessibility)",
  },
  docker: {
    category: "DEVOPS_TOOLS",
    recommendation: "Multi-Stage Dockerfiles für Next.js Apps und Docker Compose für lokale Datenbanken.",
    resourceTip: "Docker Docs & Containerizing Next.js Guides",
  },
  prisma: {
    category: "BACKEND",
    recommendation: "Prisma 7 ORM, SQLite / PostgreSQL Adapter, Migrations & Zod Schema Sync.",
    resourceTip: "Prisma.io Docs & Quickstart",
  },
  vitest: {
    category: "ARCHITECTURE",
    recommendation: "Unit-Tests für Domänenlogik & Integrationstests für API-Routen mit Mocking.",
    resourceTip: "Vitest.dev Guide",
  },
  rest: {
    category: "BACKEND",
    recommendation: "REST API Design, HTTP Status Codes, Error Handling mit Zod Validierung.",
    resourceTip: "RESTful API Design Best Practices",
  },
  git: {
    category: "DEVOPS_TOOLS",
    recommendation: "Feature Branches, Pull Request Reviews, Merge vs. Rebase & GitHub Actions CI/CD.",
    resourceTip: "Pro Git Buch & GitHub Docs",
  },
  postgresql: {
    category: "BACKEND",
    recommendation: "Relationale Datenmodellierung, Indizes, Foreign Keys und Joins.",
    resourceTip: "PostgreSQL Tutorial",
  },
  "node.js": {
    category: "BACKEND",
    recommendation: "Asynchrones JavaScript, Event Loop, Streams und Express / Next.js Server Runtimes.",
    resourceTip: "Node.js Best Practices",
  },
};

export function analyzeSkillGaps(
  jobTechStacks: (string | null | undefined)[],
  userTechStack: string
): SkillGapAnalysisResult {
  const userTechs = userTechStack
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const userTechSet = new Set(userTechs);

  const skillCounts: Record<string, number> = {};
  let totalJobs = 0;

  for (const stack of jobTechStacks) {
    if (!stack) continue;
    totalJobs++;
    const techs = stack
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    for (const tech of techs) {
      skillCounts[tech] = (skillCounts[tech] || 0) + 1;
    }
  }

  if (totalJobs === 0) {
    totalJobs = 1; // Division durch 0 vermeiden
  }

  const items: SkillGapItem[] = Object.entries(skillCounts).map(([skill, count]) => {
    const inUserProfile = userTechSet.has(skill) || userTechs.some((u) => u.includes(skill) || skill.includes(u));
    const marketDemandPercentage = Math.round((count / totalJobs) * 100);

    let priority: SkillGapItem["priority"] = "LOW";
    if (marketDemandPercentage >= 50) priority = "HIGH";
    else if (marketDemandPercentage >= 25) priority = "MEDIUM";

    const meta = SKILL_METADATA[skill] || {
      category: "OTHER" as const,
      recommendation: `Praktische Erfahrungen in ${skill} aufbauen und in einem Portfolio-Projekt anwenden.`,
      resourceTip: `Offizielle Dokumentation zu ${skill}`,
    };

    return {
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      category: meta.category,
      marketDemandCount: count,
      marketDemandPercentage,
      inUserProfile,
      priority,
      learningRecommendation: meta.recommendation,
      resourceTip: meta.resourceTip,
    };
  });

  // Nach Marktnachfrage sortieren
  items.sort((a, b) => b.marketDemandCount - a.marketDemandCount);

  const matched = items.filter((i) => i.inUserProfile);
  const highDemandMissing = items.filter((i) => !i.inUserProfile && (i.priority === "HIGH" || i.priority === "MEDIUM"));

  const coverage = items.length > 0 ? Math.round((matched.length / items.length) * 100) : 100;

  return {
    totalJobsAnalyzed: totalJobs,
    matchingSkillsCount: matched.length,
    missingHighDemandSkillsCount: highDemandMissing.length,
    profileCoveragePercentage: coverage,
    topSkills: items.slice(0, 15),
    highDemandMissing,
    learningRoadmap: {
      immediateFocus: highDemandMissing.filter((i) => i.priority === "HIGH").map((i) => i.skill),
      mediumTermFocus: highDemandMissing.filter((i) => i.priority === "MEDIUM").map((i) => i.skill),
      niceToHave: items.filter((i) => !i.inUserProfile && i.priority === "LOW").slice(0, 5).map((i) => i.skill),
    },
  };
}
