import { describe, it, expect } from "vitest";
import { parseLinkedInJsonProfile, parseLinkedInTextProfile } from "./socialProfileParser";

describe("socialProfileParser", () => {
  it("parses valid LinkedIn JSON export format", () => {
    const json = JSON.stringify({
      firstName: "Max",
      lastName: "Mustermann",
      headline: "Frontend Engineer | React & TypeScript",
      summary: "Leidenschaftlicher Web-Entwickler mit Fokus auf performante UI.",
      skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
      positions: [
        {
          title: "Junior Web Developer",
          companyName: "Tech Solutions GmbH",
          timePeriod: "2023 - Heute",
        },
      ],
      education: [
        {
          schoolName: "Berufskolleg Köln",
          degreeName: "Fachinformatiker Anwendungsentwicklung",
          timePeriod: "2021 - 2024",
        },
      ],
    });

    const parsed = parseLinkedInJsonProfile(json);

    expect(parsed.fullName).toBe("Max Mustermann");
    expect(parsed.headline).toContain("Frontend Engineer");
    expect(parsed.extractedSkills).toContain("React");
    expect(parsed.extractedSkills).toContain("TypeScript");
    expect(parsed.experiences.length).toBe(1);
    expect(parsed.experiences[0].company).toBe("Tech Solutions GmbH");
    expect(parsed.education.length).toBe(1);
  });

  it("extracts tech skills from raw profile text", () => {
    const text = `
      Maximilian Schmidt
      Softwareentwickler Frontend
      Erfahrener Entwickler im Aufbau moderner Single Page Applications mit React, Next.js, TypeScript und PostgreSQL.
      Arbeite agil nach Scrum mit Git und Docker.
    `;

    const parsed = parseLinkedInTextProfile(text);

    expect(parsed.fullName).toBe("Maximilian Schmidt");
    expect(parsed.extractedSkills).toContain("React");
    expect(parsed.extractedSkills).toContain("Next.js");
    expect(parsed.extractedSkills).toContain("TypeScript");
    expect(parsed.extractedSkills).toContain("Docker");
  });

  it("handles malformed JSON gracefully", () => {
    const parsed = parseLinkedInJsonProfile("{ malformed json");
    expect(parsed.extractedSkills).toEqual([]);
    expect(parsed.experiences).toEqual([]);
  });
});
