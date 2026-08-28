import { describe, it, expect } from "vitest";
import { generateInterviewCheatsheetHtml } from "./interviewCheatsheet";
import { INTERVIEW_QUESTIONS } from "./interviewGuide";

describe("generateInterviewCheatsheetHtml", () => {
  it("erzeugt druckfertiges Cheatsheet HTML mit Fragen und persönlichen Notizen", () => {
    const html = generateInterviewCheatsheetHtml({
      candidateName: "Max Mustermann",
      companyName: "Acme Tech",
      position: "Frontend Entwickler",
      questions: INTERVIEW_QUESTIONS.slice(0, 3),
      personalNotes: {
        [INTERVIEW_QUESTIONS[0].id]: "Meine individuelle Formulierung für das Gespräch.",
      },
    });

    expect(html).toContain("Interview-Vorbereitungs-Spickzettel");
    expect(html).toContain("Acme Tech");
    expect(html).toContain("Max Mustermann");
    expect(html).toContain("Meine individuelle Formulierung für das Gespräch.");
  });
});
