import { describe, it, expect } from "vitest";
import { evaluateAtsCompatibility } from "./atsChecker";
import type { PreferencesWithProfile } from "@/types";

describe("atsChecker", () => {
  const mockPreferences: PreferencesWithProfile = {
    id: "default",
    fullName: "Alexander Schepp",
    email: "alexander.schepp@example.com",
    phone: "0170 1234567",
    street: "Musterstraße 1",
    postalCode: "53111",
    city: "Bonn",
    desiredRole: "Fachinformatiker für Anwendungsentwicklung",
    techStack: "TypeScript,React,Next.js,Tailwind,CSS,HTML,REST,Prisma,SQLite,Vitest",
    preferredLocations: "Bonn,Dortmund,Remote",
    searchRadiusKm: 50,
    remotePreference: "HYBRID",
    minSalary: 48000,
    profileSummary: "Fachinformatiker für Anwendungsentwicklung mit starkem Fokus auf modernes React, TypeScript und Fullstack Next.js Entwicklung.",
    weeklyGoal: 5,
    excludedCompanies: null,
    excludedKeywords: null,
    excludedTechStack: null,
    aiProvider: null,
    aiApiKey: null,
    aiModel: null,
    portfolioShareToken: null,
    portfolioTokenExpiresAt: null,
    portfolioViewCount: 0,
    portfolioActive: true,
    imapHost: null,
    imapPort: null,
    imapUser: null,
    imapFolder: "INBOX",
    imapEnabled: false,
    imapPassword: null,
    backgroundSchedulerEnabled: true,
    minMatchScore: 0,
    updatedAt: new Date(),
    educationEntries: [
      {
        id: "edu-1",
        type: "UMSCHULUNG",
        title: "Fachinformatiker für Anwendungsentwicklung",
        institution: "Gfn GmbH Bonn",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2025-01-01"),
        description: "Schwerpunkte: Frontend, React, TypeScript, Datenbanken",
        sortOrder: 0,
        preferencesId: "default",
      },
    ],
    projectEntries: [
      {
        id: "proj-1",
        title: "electroCheck-ai",
        description: "KI-gestützte Prüfprotokoll-Plattform",
        techStack: "Next.js,React,TypeScript,Tailwind,Prisma",
        url: "https://github.com/example/electrocheck",
        role: "Fullstack Entwickler",
        sortOrder: 0,
        preferencesId: "default",
      },
    ],
  };

  it("bewertet ein vollständiges Entwicklerprofil mit einem hohen ATS-Score", () => {
    const result = evaluateAtsCompatibility({
      preferences: mockPreferences,
      targetJobTechStack: "TypeScript,React,Tailwind,REST",
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toMatch(/OPTIMAL|GUT/);
    expect(result.breakdown.contactClarity).toBe(100);
    expect(result.matchedKeywords).toContain("typescript");
    expect(result.matchedKeywords).toContain("react");
  });

  it("erkennt fehlende Kontaktdaten und vergibt Abzüge & Warnungen", () => {
    const incompletePrefs: PreferencesWithProfile = {
      ...mockPreferences,
      email: "",
      phone: null,
      educationEntries: [],
    };

    const result = evaluateAtsCompatibility({
      preferences: incompletePrefs,
      targetJobTechStack: "TypeScript,React",
    });

    expect(result.overallScore).toBeLessThan(80);
    expect(result.atsWarnings.length).toBeGreaterThan(0);
  });
});
