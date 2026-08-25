import { describe, it, expect } from "vitest";
import { polishCoverLetterWithAI, evaluateInterviewAnswerWithAI } from "./aiService";

describe("aiService (hybrid offline/online)", () => {
  it("provides smart offline fallback for cover letter polishing", async () => {
    const original = "Sehr geehrte Damen und Herren, hiermit bewerbe ich mich mit großem Interesse auf Ihre ausgeschriebene Stelle.";
    const result = await polishCoverLetterWithAI({
      coverLetter: original,
      jobTitle: "Frontend Entwickler",
      techStack: "React, TypeScript",
      apiKey: "", // No API key -> offline fallback
    });

    expect(result.usedAi).toBe(false);
    expect(result.modelUsed).toContain("Offline");
    expect(result.polishedContent).toContain("mit Begeisterung für moderne Web-Entwicklung");
    expect(result.improvements.length).toBeGreaterThan(0);
  });

  it("provides robust offline interview answer evaluation", async () => {
    const question = "Was ist der Unterschied zwischen Props und State in React?";
    const answer = "Props werden von außen übergeben und sind immutable. State wird innerhalb der Komponente verwaltet und triggert bei Änderung Re-Renders.";
    const ideal = "Props sind Parameter von Elternkomponenten (read-only), State ist lokaler, veränderlicher Zustand der Komponente.";

    const result = await evaluateInterviewAnswerWithAI({
      question,
      answer,
      idealAnswer: ideal,
      apiKey: null,
    });

    expect(result.usedAi).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.feedback).toBeDefined();
    expect(result.starMethodScore).toBeDefined();
  });
});
