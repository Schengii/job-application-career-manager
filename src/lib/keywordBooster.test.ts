import { describe, expect, it } from "vitest";
import { analyzeCoverLetterKeywords } from "./keywordBooster";

describe("keywordBooster", () => {
  it("analysiert gematchte und fehlende Keywords im Anschreiben", () => {
    const text = "Ich entwickle moderne Web-Apps mit React, TypeScript und Tailwind CSS unter Verwendung von Git und Clean Code.";
    const result = analyzeCoverLetterKeywords(text, "Wir suchen Entwickler mit React, TypeScript, Docker und Vitest.");

    expect(result.matchedKeywords).toContain("react");
    expect(result.matchedKeywords).toContain("typescript");
    expect(result.matchedKeywords).toContain("tailwind");
    expect(result.missingKeywords).toContain("docker");
    expect(result.missingKeywords).toContain("vitest");
    expect(result.matchScore).toBeGreaterThan(30);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("gibt 100% MatchScore wenn alle Kerntechnologien enthalten sind", () => {
    const text = "typescript react next.js javascript tailwind css html rest git testing ui/ux clean code agil";
    const result = analyzeCoverLetterKeywords(text, "");
    expect(result.matchScore).toBe(100);
    expect(result.missingKeywords.length).toBe(0);
  });
});
