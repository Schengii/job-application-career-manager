import { describe, expect, it } from "vitest";
import { generateCvHtml, formatMonthYear } from "./cvGenerator";
import type { PreferencesWithProfile } from "@/types";

describe("cvGenerator", () => {
  const dummyPreferences: PreferencesWithProfile = {
    id: "pref-1",
    fullName: "Max Mustermann",
    email: "max@example.com",
    phone: "0123 456789",
    street: "Musterstr. 1",
    city: "Bonn",
    postalCode: "53111",
    desiredRole: "Frontend Entwickler",
    techStack: "TypeScript, React, Next.js",
    preferredLocations: "Bonn, Remote",
    searchRadiusKm: 50,
    minSalary: null,
    remotePreference: "REMOTE",
    profileSummary: "Motivierter Frontend-Entwickler mit technischem Hintergrund.",
    weeklyGoal: 5,
    excludedCompanies: null,
    excludedKeywords: null,
    excludedTechStack: null,
    aiProvider: "openai",
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
    minMatchScore: 0,
    updatedAt: new Date(),
    educationEntries: [
      {
        id: "edu-1",
        preferencesId: "pref-1",
        type: "EDUCATION",
        title: "Umschulung Fachinformatiker AE",
        institution: "BFW Köln",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2026-01-01"),
        description: "Schwerpunkt moderne Webanwendungen",
        sortOrder: 0,
      },
    ],
    projectEntries: [
      {
        id: "proj-1",
        preferencesId: "pref-1",
        title: "electroCheck-ai",
        role: "Lead Frontend Developer",
        techStack: "Next.js, TypeScript, Tailwind",
        description: "KI-gestützte Prüfprotokoll-Auswertung",
        url: "https://github.com/example/electrocheck",
        sortOrder: 0,
      },
    ],
  };

  it("formatiert Datumsangaben als MM/YYYY", () => {
    expect(formatMonthYear(new Date("2025-06-15"))).toBe("06/2025");
    expect(formatMonthYear(null)).toBe("heute");
  });

  it("erstellt druckfertiges HTML mit persönlichen Daten, Ausbildung und Projekten", () => {
    const html = generateCvHtml(dummyPreferences, { layout: "MODERN" });

    expect(html).toContain("Max Mustermann");
    expect(html).toContain("Frontend Entwickler");
    expect(html).toContain("Umschulung Fachinformatiker AE");
    expect(html).toContain("electroCheck-ai");
    expect(html).toContain("TypeScript");
  });
});
