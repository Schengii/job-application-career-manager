import { describe, it, expect } from "vitest";
import { analyzeJobRedFlags } from "./jobRedFlags";

describe("jobRedFlags", () => {
  it("erkennt Red Flags wie Überstunden, Familie und Stressresistenz", () => {
    const text = `Wir suchen einen Alleskönner für unser Team. Bei uns herrscht eine familiäre Atmosphäre,
dafür setzen wir hohe Belastbarkeit und Stressresistenz voraus. Eventuelle Überstunden sind mit dem Gehalt abgegolten.`;

    const analysis = analyzeJobRedFlags(text);
    expect(analysis.redFlags.length).toBeGreaterThanOrEqual(3);
    expect(analysis.redFlags.some((rf) => rf.id === "family_culture")).toBe(true);
    expect(analysis.redFlags.some((rf) => rf.id === "high_stress")).toBe(true);
    expect(analysis.redFlags.some((rf) => rf.id === "vague_overtime")).toBe(true);
    expect(analysis.score).toBeLessThan(60);
    expect(analysis.interviewQuestions.length).toBeGreaterThan(0);
  });

  it("erkennt Green Flags wie Weiterbildung, 100% Remote und modernen Stack", () => {
    const text = `Wir bieten 100% Remote, freie Wohnortwahl, ein jährliches Weiterbildungsbudget von 2.000 € sowie freie Hardware-Wahl (MacBook Pro).
Dein Tech-Stack umfasst TypeScript, Next.js, React 19 und Tailwind CSS mit CI/CD. Gehalt: 50.000 - 62.000 Euro.`;

    const analysis = analyzeJobRedFlags(text);
    expect(analysis.greenFlags.length).toBeGreaterThanOrEqual(4);
    expect(analysis.greenFlags.some((gf) => gf.id === "remote_friendly")).toBe(true);
    expect(analysis.greenFlags.some((gf) => gf.id === "learning_budget")).toBe(true);
    expect(analysis.greenFlags.some((gf) => gf.id === "modern_stack")).toBe(true);
    expect(analysis.score).toBeGreaterThanOrEqual(85);
    expect(analysis.redFlags.length).toBe(0);
  });
});
