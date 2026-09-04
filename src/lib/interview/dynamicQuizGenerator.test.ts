import { describe, it, expect } from "vitest";
import { generateCustomJobQuiz } from "@/lib/interview/dynamicQuizGenerator";

describe("dynamicQuizGenerator", () => {
  it("erzeugt maßgeschneiderte Fragen basierend auf Next.js und TypeScript Stack", () => {
    const questions = generateCustomJobQuiz("Next.js, TypeScript, React 19, Tailwind", "Senior Frontend Engineer");

    expect(questions.length).toBeGreaterThanOrEqual(4);
    expect(questions.some((q) => q.id === "job-nextjs-rsc")).toBe(true);
    expect(questions.some((q) => q.id === "job-ts-unions")).toBe(true);
    expect(questions.some((q) => q.id === "job-react19-actions")).toBe(true);
    expect(questions.some((q) => q.id === "job-tailwind-performance")).toBe(true);
  });

  it("liefert mindestens solide Testing-Fragen auch bei leerem Tech-Stack", () => {
    const questions = generateCustomJobQuiz("", "");
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.some((q) => q.id === "job-testing-rtl")).toBe(true);
  });
});
