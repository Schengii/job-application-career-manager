import { describe, it, expect } from "vitest";
import { CODING_CHALLENGES, executeSandboxCode } from "./sandboxChallenges";

describe("sandboxChallenges", () => {
  it("führt erfolgreiche Lösung für flatten-array fehlerfrei aus", async () => {
    const flattenChallenge = CODING_CHALLENGES.find((c) => c.id === "flatten-array")!;
    const res = await executeSandboxCode(flattenChallenge.solutionCode, flattenChallenge);

    expect(res.success).toBe(true);
    expect(res.results.length).toBe(1);
    expect(res.results[0].passed).toBe(true);
  });

  it("erkennt fehlerhaften Code und meldet nicht bestandene Tests", async () => {
    const flattenChallenge = CODING_CHALLENGES.find((c) => c.id === "flatten-array")!;
    const wrongCode = "function flatten(arr) { return arr; }";
    const res = await executeSandboxCode(wrongCode, flattenChallenge);

    expect(res.success).toBe(false);
    expect(res.results[0].passed).toBe(false);
  });

  it("fängt Syntaxfehler sauber ab", async () => {
    const flattenChallenge = CODING_CHALLENGES.find((c) => c.id === "flatten-array")!;
    const brokenCode = "function flatten(arr) { return ;;;";
    const res = await executeSandboxCode(brokenCode, flattenChallenge);

    expect(res.success).toBe(false);
    expect(res.errorMessage).toBeDefined();
  });
});
