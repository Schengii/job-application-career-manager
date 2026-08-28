import { describe, it, expect } from "vitest";
import {
  DEFAULT_SKILL_GOALS,
  calculateSkillGoalProgress,
  calculateTotalRoadmapProgress,
} from "./skillRoadmap";

describe("skillRoadmap", () => {
  it("berechnet den prozentualen Fortschritt eines Ziels korrekt", () => {
    const goal = DEFAULT_SKILL_GOALS[0];
    const progress = calculateSkillGoalProgress(goal);
    expect(progress).toBe(100);
  });

  it("berechnet den Gesamtfahrplan-Fortschritt über alle Ziele", () => {
    const stats = calculateTotalRoadmapProgress(DEFAULT_SKILL_GOALS);
    expect(stats.totalMilestones).toBeGreaterThanOrEqual(10);
    expect(stats.completedMilestones).toBeGreaterThan(0);
    expect(stats.overallPercentage).toBeGreaterThan(0);
    expect(stats.overallPercentage).toBeLessThanOrEqual(100);
  });
});
