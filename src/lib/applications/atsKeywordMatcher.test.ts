import { describe, expect, it } from "vitest";
import { analyzeAtsKeywords } from "./atsKeywordMatcher";

describe("atsKeywordMatcher", () => {
  const sampleJob = `
    Wir suchen einen Frontend-Entwickler mit starken Kenntnissen in React, TypeScript und Tailwind CSS.
    Erfahrung mit Next.js und Git setzen wir voraus. Idealerweise bringst du Testing-Erfahrung mit Vitest mit.
  `;

  it("erkennt geforderte Keywords aus der Stellenanzeige", () => {
    const analysis = analyzeAtsKeywords(sampleJob, "");
    expect(analysis.totalJobKeywords).toBeGreaterThanOrEqual(5);

    const kwNames = analysis.keywords.map((k) => k.keyword.toLowerCase());
    expect(kwNames).toContain("react");
    expect(kwNames).toContain("typescript");
    expect(kwNames).toContain("tailwind");
    expect(kwNames).toContain("next.js");
    expect(kwNames).toContain("git");
    expect(kwNames).toContain("vitest");
  });

  it("berechnet ATS-Score basierend auf Treffern im Anschreiben", () => {
    const coverLetter = `
      Sehr geehrte Damen und Herren,
      ich entwickle mit React und TypeScript seit mehreren Jahren. Für das Styling setze ich Tailwind ein.
      Versionskontrolle erfolgt über Git.
    `;

    const analysis = analyzeAtsKeywords(sampleJob, coverLetter);
    expect(analysis.matchedCount).toBeGreaterThanOrEqual(4);
    expect(analysis.atsScore).toBeGreaterThanOrEqual(50);

    const missingNames = analysis.missingKeywords.map((k) => k.keyword.toLowerCase());
    expect(missingNames).toContain("vitest");
    expect(missingNames).toContain("next.js");
  });

  it("liefert 100% Score, wenn alle Keywords vorhanden sind", () => {
    const perfectLetter = `
      React, TypeScript, Tailwind, CSS, Next.js, Git, Vitest, Testing
    `;
    const analysis = analyzeAtsKeywords(sampleJob, perfectLetter);
    expect(analysis.missingKeywords).toHaveLength(0);
    expect(analysis.atsScore).toBe(100);
  });
});
