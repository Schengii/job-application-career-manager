// -----------------------------------------------------------------------------
// Skill-Roadmap & Lernziel-Engine mit Meilensteinen
// -----------------------------------------------------------------------------
// Ermöglicht das Verfolgen von fachlichen Entwicklungszielen für
// Fachinformatiker Anwendungsentwicklung (Frontend- & Fullstack-Schwerpunkt).
// -----------------------------------------------------------------------------

export type Milestone = {
  id: string;
  title: string;
  category: "Frontend" | "Backend" | "DevOps" | "Testing";
  completed: boolean;
  dueDate?: string;
  challengeRefId?: string;
};

export type SkillGoal = {
  id: string;
  title: string;
  description: string;
  targetLevel: "Junior" | "Mid" | "Senior";
  marketRelevancePct: number;
  milestones: Milestone[];
};

export const DEFAULT_SKILL_GOALS: SkillGoal[] = [
  {
    id: "goal-react-19",
    title: "React 19 & Next.js App Router Architektur",
    description: "Tiefes Verständnis von Server Components, Server Actions, Streaming und Optimistic UI.",
    targetLevel: "Mid",
    marketRelevancePct: 95,
    milestones: [
      { id: "m-r1", title: "Server Actions & useActionState verstehen", category: "Frontend", completed: true },
      { id: "m-r2", title: "Optimistic UI Transitions implementieren", category: "Frontend", completed: true },
      { id: "m-r3", title: "Custom Hooks & Debounce Pattern beherrschen", category: "Frontend", completed: true, challengeRefId: "use-debounce-fn" },
    ],
  },
  {
    id: "goal-typescript",
    title: "Advanced TypeScript & Type-Safety",
    description: "Generics, Utility Types, Type-Guards und Zod-Schemaschnittstellen für robuste Web-Apps.",
    targetLevel: "Mid",
    marketRelevancePct: 92,
    milestones: [
      { id: "m-ts1", title: "Discriminated Unions für State-Maschinen", category: "Frontend", completed: true },
      { id: "m-ts2", title: "Typsichere GroupBy- & Filter-Algorithmen", category: "Frontend", completed: true, challengeRefId: "group-by-key" },
      { id: "m-ts3", title: "Zod Schema Validierung für API-Routen", category: "Backend", completed: true },
    ],
  },
  {
    id: "goal-testing",
    title: "Automated Testing & E2E Verification",
    description: "Unit-Tests mit Vitest, Komponenten-Tests mit RTL und Playwright E2E-Pipelines.",
    targetLevel: "Senior",
    marketRelevancePct: 88,
    milestones: [
      { id: "m-t1", title: "Vitest Unit-Tests für Domänenlogik schreiben", category: "Testing", completed: true },
      { id: "m-t2", title: "React Testing Library User-Interaktionen", category: "Testing", completed: true },
      { id: "m-t3", title: "GitHub Actions CI Pipeline für automatischen Testlauf", category: "DevOps", completed: true },
    ],
  },
  {
    id: "goal-cloud-devops",
    title: "Containerisierung & Modernes Deployment",
    description: "Docker, SQLite/Postgres Prisma Migrationen und Edge Caching.",
    targetLevel: "Mid",
    marketRelevancePct: 84,
    milestones: [
      { id: "m-d1", title: "Multi-Stage Dockerfile für Next.js Apps", category: "DevOps", completed: false, dueDate: "2026-09-15" },
      { id: "m-d2", title: "Prisma 7 Driver Adapter & Migrationen", category: "Backend", completed: true },
    ],
  },
];

export function calculateSkillGoalProgress(goal: SkillGoal): number {
  if (goal.milestones.length === 0) return 0;
  const completed = goal.milestones.filter((m) => m.completed).length;
  return Math.round((completed / goal.milestones.length) * 100);
}

export function calculateTotalRoadmapProgress(goals: SkillGoal[]): {
  totalMilestones: number;
  completedMilestones: number;
  overallPercentage: number;
} {
  const allMilestones = goals.flatMap((g) => g.milestones);
  const totalMilestones = allMilestones.length;
  const completedMilestones = allMilestones.filter((m) => m.completed).length;
  const overallPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return { totalMilestones, completedMilestones, overallPercentage };
}
