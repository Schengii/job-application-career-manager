import { describe, it, expect } from "vitest";
import { getQuizFocusRecommendations } from "@/lib/interview/skillGapToQuizFocus";
import { SkillGapItem } from "@/lib/interview/skillGapAnalyzer";
import { TECH_QUIZ_QUESTIONS } from "@/lib/interview/techQuizEngine";

function makeGap(overrides: Partial<SkillGapItem>): SkillGapItem {
  return {
    skill: "Typescript",
    category: "FRONTEND",
    marketDemandCount: 5,
    marketDemandPercentage: 60,
    inUserProfile: false,
    priority: "HIGH",
    learningRecommendation: "Lerne mehr.",
    resourceTip: "Docs",
    ...overrides,
  };
}

describe("skillGapToQuizFocus", () => {
  it("empfiehlt Quiz-Fokus nur für Skills mit passenden Fragen im Katalog", () => {
    const gaps: SkillGapItem[] = [
      makeGap({ skill: "TypeScript", priority: "HIGH", marketDemandPercentage: 70 }),
      makeGap({ skill: "GraphQL", priority: "HIGH", marketDemandPercentage: 65 }), // kein passender Quiz-Content
    ];

    const recommendations = getQuizFocusRecommendations(gaps);

    expect(recommendations.length).toBe(1);
    expect(recommendations[0].skill).toBe("TypeScript");
    expect(recommendations[0].questionCount).toBeGreaterThan(0);
    expect(recommendations[0].questions.every((q) => q.relatedSkills.includes("typescript"))).toBe(
      true
    );
  });

  it("respektiert das limit und die Priorisierungsreihenfolge der Eingabe", () => {
    const gaps: SkillGapItem[] = [
      makeGap({ skill: "React", priority: "HIGH" }),
      makeGap({ skill: "TypeScript", priority: "HIGH" }),
      makeGap({ skill: "CSS", priority: "MEDIUM" }),
      makeGap({ skill: "Next.js", priority: "MEDIUM" }),
    ];

    const recommendations = getQuizFocusRecommendations(gaps, TECH_QUIZ_QUESTIONS, 2);

    expect(recommendations.length).toBe(2);
    expect(recommendations.map((r) => r.skill)).toEqual(["React", "TypeScript"]);
  });

  it("liefert eine leere Liste, wenn keine Gaps übergeben werden", () => {
    expect(getQuizFocusRecommendations([])).toEqual([]);
  });
});
