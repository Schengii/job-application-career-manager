import { describe, expect, it } from "vitest";
import { evaluateInterviewAnswer } from "@/lib/interview/mockInterviewEngine";
import { INTERVIEW_QUESTIONS } from "@/lib/interview/interviewGuide";

describe("mockInterviewEngine", () => {
  const rscQuestion = INTERVIEW_QUESTIONS.find((q) => q.id === "react-1")!;

  it("bewertet eine vollständige, fachlich fundierte Antwort mit hoher Punktzahl", () => {
    const userAnswer =
      "Server Components werden standardmäßig auf dem Server gerendert und senden kein JavaScript-Bundle an den Client. Client Components mit 'use client' führen wir im Browser aus für State und interaktive Event-Handler. In meinem electroCheck-ai Projekt habe ich das intensiv genutzt.";

    const evaluation = evaluateInterviewAnswer(rscQuestion, userAnswer);

    expect(evaluation.score).toBeGreaterThanOrEqual(70);
    expect(evaluation.rating).toBe("AUSGEZEICHNET");
    expect(evaluation.matchedKeywords.length).toBeGreaterThan(0);
    expect(evaluation.feedback.some((f) => f.includes("Praxisbezug"))).toBe(true);
  });

  it("bewertet eine zu kurze Antwort als unvollständig", () => {
    const evaluation = evaluateInterviewAnswer(rscQuestion, "Keine Ahnung.");
    expect(evaluation.score).toBeLessThanOrEqual(30);
    expect(evaluation.rating).toBe("UNVOLLSTÄNDIG");
  });
});
