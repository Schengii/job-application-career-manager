import { describe, expect, it } from "vitest";
import { getQuestionsForTechStack, INTERVIEW_QUESTIONS } from "./interviewGuide";

describe("getQuestionsForTechStack", () => {
  it("liefert alle Fragen zurück wenn kein spezifischer Tech-Stack übergeben wird", () => {
    const questions = getQuestionsForTechStack(null);
    expect(questions.length).toBe(INTERVIEW_QUESTIONS.length);
  });

  it("filtert Fachfragen basierend auf Tech-Stack-Keywords", () => {
    const reactQuestions = getQuestionsForTechStack("React,Next.js");
    expect(reactQuestions.some((q) => q.keywords.includes("React"))).toBe(true);

    // Werdegangs- und Gegenfragen bleiben stets erhalten
    expect(reactQuestions.some((q) => q.category === "CAREER_BACKGROUND")).toBe(true);
    expect(reactQuestions.some((q) => q.category === "QUESTIONS_FOR_EMPLOYER")).toBe(true);
  });
});
