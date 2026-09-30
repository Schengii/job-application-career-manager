import { describe, it, expect } from "vitest";
import { generateCoverLetterAbVariants } from "./coverLetterAbTesting";

describe("coverLetterAbTesting", () => {
  it("generates distinct variants A and B for a position", () => {
    const res = generateCoverLetterAbVariants({
      companyName: "Acme Corp",
      position: "Senior Frontend Engineer",
      techStack: "React 19, TypeScript, Next.js",
      applicantName: "Alex Developer",
    });

    expect(res.companyName).toBe("Acme Corp");
    expect(res.position).toBe("Senior Frontend Engineer");

    // Variant A checks (Technical focus)
    expect(res.variantA.id).toBe("A");
    expect(res.variantA.focus).toContain("Architektur");
    expect(res.variantA.openingSentence).toContain("Acme Corp");
    expect(res.variantA.fullDraft).toContain("Alex Developer");

    // Variant B checks (Agile / Team focus)
    expect(res.variantB.id).toBe("B");
    expect(res.variantB.focus).toContain("Team");
    expect(res.variantB.highlightParagraph).toContain("Scrum");

    // Variants should differ meaningfully
    expect(res.variantA.fullDraft).not.toBe(res.variantB.fullDraft);
    expect(res.variantA.openingSentence).not.toBe(res.variantB.openingSentence);
  });
});
