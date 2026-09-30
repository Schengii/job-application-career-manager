import { describe, it, expect } from "vitest";
import { analyzeInterviewNotes } from "./interviewAudioFeedback";

describe("interviewAudioFeedback", () => {
  it("analyzes positive interview notes accurately", () => {
    const notes =
      "Super Gespräch mit dem Teamleiter! Guter Eindruck, Team passt perfekt und sie haben schnelles Feedback und die nächste Runde in Aussicht gestellt. Besprochen: React, TypeScript und Clean Code.";
    const res = analyzeInterviewNotes(notes);

    expect(res.sentiment).toBe("VERY_POSITIVE");
    expect(res.readinessScore).toBeGreaterThanOrEqual(80);
    expect(res.discussedTopics).toContain("REACT");
    expect(res.discussedTopics).toContain("TYPESCRIPT");
    expect(res.strengths.length).toBeGreaterThan(0);
    expect(res.weaknesses.length).toBe(0);
  });

  it("identifies points of friction or uncertainty", () => {
    const notes =
      "Fragen zu Docker und Kubernetes waren schwierig, wusste nicht genau Bescheid und war etwas nervös.";
    const res = analyzeInterviewNotes(notes);

    expect(res.weaknesses.length).toBeGreaterThan(0);
    expect(res.readinessScore).toBeLessThan(65);
    expect(res.discussedTopics).toContain("DOCKER");
    expect(res.followUpAdvice).toContain("Dankes-E-Mail");
  });

  it("handles empty notes gracefully", () => {
    const res = analyzeInterviewNotes("");
    expect(res.sentiment).toBe("NEUTRAL");
    expect(res.readinessScore).toBe(50);
  });
});
