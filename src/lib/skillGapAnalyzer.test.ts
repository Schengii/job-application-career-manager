import { describe, it, expect } from "vitest";
import { analyzeSkillGaps } from "./skillGapAnalyzer";

describe("skillGapAnalyzer", () => {
  it("berechnet Skill-Häufigkeiten und identifiziert fehlende Kernkompetenzen", () => {
    const jobTechStacks = [
      "TypeScript,React,Next.js,Docker",
      "TypeScript,React,Tailwind,Docker",
      "React,JavaScript,CSS,Docker",
      "TypeScript,Vue,PostgreSQL",
    ];

    const userTechStack = "TypeScript,React,CSS,JavaScript,HTML";

    const result = analyzeSkillGaps(jobTechStacks, userTechStack);

    expect(result.totalJobsAnalyzed).toBe(4);
    expect(result.matchingSkillsCount).toBeGreaterThan(0);

    // Docker kommt in 3 von 4 Jobs vor (75%) und fehlt im User-Stack
    const dockerItem = result.highDemandMissing.find((i) => i.skill.toLowerCase() === "docker");
    expect(dockerItem).toBeDefined();
    expect(dockerItem?.priority).toBe("HIGH");
    expect(dockerItem?.marketDemandPercentage).toBe(75);
    expect(result.learningRoadmap.immediateFocus).toContain("Docker");
  });
});
