import { describe, expect, it } from "vitest";
import { generateElevatorPitch } from "@/lib/interview/elevatorPitchGenerator";

describe("elevatorPitchGenerator", () => {
  it("generiert einen vollständigen Elevator Pitch mit Standardwerten", () => {
    const pitch = generateElevatorPitch({
      focus: "FRONTEND_EXPERT",
      targetRole: "Senior Frontend Engineer",
      targetCompany: "Adesso SE",
    });

    expect(pitch.hook).toContain("Entwickler");
    expect(pitch.motivationClosing).toContain("Adesso SE");
    expect(pitch.motivationClosing).toContain("Senior Frontend Engineer");
    expect(pitch.estimatedSpeechDurationSeconds).toBeGreaterThanOrEqual(45);
    expect(pitch.tacticalTips.length).toBeGreaterThan(2);
  });

  it("berücksichtigt unterschiedliche Schwerpunkte", () => {
    const fullstack = generateElevatorPitch({
      focus: "FULLSTACK_AGILE",
      signatureProject: "E-Commerce Cloud Plattform",
    });

    expect(fullstack.hook).toContain("Next.js-Frontend und sauberer Backend-Logik");
    expect(fullstack.practicalProof).toContain("E-Commerce Cloud Plattform");

    const quality = generateElevatorPitch({
      focus: "PERFORMANCE_QUALITY",
    });

    expect(quality.hook).toContain("automatisierte Tests");
  });

  it("schätzt die Sprechdauer plausibel ab", () => {
    const pitch = generateElevatorPitch({
      focus: "CAREER_CHANGER",
      keyTechnologies: ["React", "TypeScript", "Node.js", "Docker"],
    });

    expect(pitch.fullPitch.length).toBeGreaterThan(200);
    expect(pitch.estimatedSpeechDurationSeconds).toBeLessThan(120);
  });
});
