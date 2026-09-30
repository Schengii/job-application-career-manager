import { describe, it, expect } from "vitest";
import { generateProjectPortfolioHtml } from "./portfolioPdfGenerator";
import type { PreferencesWithProfile } from "@/types";

describe("portfolioPdfGenerator", () => {
  it("generates valid HTML document for developer portfolio", () => {
    const mockPrefs = {
      id: "pref-1",
      fullName: "Max Mustermann",
      email: "max@dev.de",
      city: "Köln",
      desiredRole: "Frontend Architect",
      techStack: "React, TypeScript",
      preferredLocations: "Bonn",
      searchRadiusKm: 50,
      remotePreference: "REMOTE_PREFERRED",
      minSalary: 55000,
      weeklyGoal: 5,
      minMatchScore: 60,
      aiProvider: "openai",
      projectEntries: [
        {
          id: "p-1",
          preferencesId: "pref-1",
          title: "electroCheck-ai",
          role: "Fullstack Lead",
          description: "KI-gestützte Prüfplattform nach DGUV V3.",
          techStack: "Next.js 16, TypeScript, Tailwind",
          url: "https://electrocheck-ai.de",
          sortOrder: 1,
        },
      ],
      educationEntries: [],
      careerProfiles: [],
      coverLetterSnippets: [],
    };

    const html = generateProjectPortfolioHtml(mockPrefs as unknown as PreferencesWithProfile);

    expect(html).toContain("Max Mustermann");
    expect(html).toContain("Praxis-Projektportfolio");
    expect(html).toContain("electroCheck-ai");
    expect(html).toContain("Fullstack Lead");
    expect(html).toContain("https://electrocheck-ai.de");
  });
});
