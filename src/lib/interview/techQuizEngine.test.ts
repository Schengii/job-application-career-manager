import { describe, it, expect } from "vitest";
import { TECH_QUIZ_QUESTIONS, evaluateQuizSession, getQuestionsBySkills } from "@/lib/interview/techQuizEngine";

describe("techQuizEngine", () => {
  it("enthält fundierte Fachfragen mit Code-Snippets und Erklärungen", () => {
    expect(TECH_QUIZ_QUESTIONS.length).toBeGreaterThanOrEqual(5);
    for (const q of TECH_QUIZ_QUESTIONS) {
      expect(q.question).toBeDefined();
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      expect(q.explanation).toBeDefined();
      expect(q.keyTakeaway).toBeDefined();
    }
  });

  it("bewertet eine Quiz-Session korrekt mit Prozenten und Breakdown", () => {
    const perfectAnswers: Record<string, number> = {};
    for (const q of TECH_QUIZ_QUESTIONS) {
      perfectAnswers[q.id] = q.correctIndex;
    }

    const result = evaluateQuizSession(perfectAnswers);
    expect(result.scorePct).toBe(100);
    expect(result.correctAnswers).toBe(TECH_QUIZ_QUESTIONS.length);
    expect(result.feedbackSummary).toContain("Hervorragendes");
  });

  it("jede Frage hat mindestens einen zugeordneten Skill", () => {
    for (const q of TECH_QUIZ_QUESTIONS) {
      expect(q.relatedSkills.length).toBeGreaterThan(0);
    }
  });

  it("getQuestionsBySkills filtert case-insensitive nach Skill-Namen", () => {
    const result = getQuestionsBySkills(["TypeScript"]);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((q) => q.relatedSkills.includes("typescript"))).toBe(true);
  });

  it("getQuestionsBySkills liefert leeres Array für unbekannte Skills", () => {
    expect(getQuestionsBySkills(["cobol"])).toEqual([]);
  });

  it("getQuestionsBySkills liefert leeres Array bei leerer Eingabe", () => {
    expect(getQuestionsBySkills([])).toEqual([]);
  });
});
