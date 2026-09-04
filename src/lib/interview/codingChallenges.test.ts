import { describe, it, expect } from "vitest";
import {
  CODING_CHALLENGES,
  executeChallengeCode,
} from "@/lib/interview/codingChallenges";

describe("codingChallenges", () => {
  it("enthält mindestens 4 strukturierte Praxisaufgaben", () => {
    expect(CODING_CHALLENGES.length).toBeGreaterThanOrEqual(4);
  });

  it("führt validen Lösungscode für group-by-key erfolgreich aus", () => {
    const challenge = CODING_CHALLENGES.find((c) => c.id === "group-by-key")!;
    expect(challenge).toBeDefined();

    const result = executeChallengeCode(challenge, challenge.solutionCode);
    expect(result.success).toBe(true);
    expect(result.passedTests).toBe(challenge.testCases.length);
  });

  it("erkennt fehlerhaften Code und meldet den Testfall als nicht bestanden", () => {
    const challenge = CODING_CHALLENGES.find((c) => c.id === "group-by-key")!;
    const faultyCode = `function groupBy() { return {}; }`;

    const result = executeChallengeCode(challenge, faultyCode);
    expect(result.success).toBe(false);
    expect(result.logs[0]).toContain("Fehlgeschlagen");
  });

  it("fängt Syntax- und Laufzeitfehler sicher ab", () => {
    const challenge = CODING_CHALLENGES[0];
    const invalidCode = `function debounce() { throw new Error("Boom"); }`;

    const result = executeChallengeCode(challenge, invalidCode);
    expect(result.success).toBe(false);
  });
});
