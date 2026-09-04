import { describe, it, expect } from "vitest";
import { exportToJsonResume, parseJsonResumeImport, JsonResumeSchema } from "@/lib/documents/jsonResume";
import type { PreferencesWithProfile } from "@/types";

describe("jsonResume", () => {
  const mockPreferences: PreferencesWithProfile = {
    id: "default",
    fullName: "Alexander Schepp",
    email: "alexander.schepp@example.com",
    phone: "0170 1234567",
    street: "Musterstraße 1",
    postalCode: "53111",
    city: "Bonn",
    desiredRole: "Fachinformatiker für Anwendungsentwicklung",
    techStack: "TypeScript,React,Next.js",
    preferredLocations: "Bonn,Remote",
    searchRadiusKm: 50,
    remotePreference: "HYBRID",
    minSalary: 48000,
    profileSummary: "Frontend Developer",
    standardCoverLetterBody: null,
    coverLetterOpeningSentence: null,
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
    digestEnabled: true,
    lastDigestSentAt: null,
    lastSchedulerErrorSource: null,
    lastSchedulerErrorMessage: null,
    lastSchedulerErrorAt: null,
    minMatchScore: 0,
    updatedAt: new Date(),
    educationEntries: [
      {
        id: "edu-1",
        type: "UMSCHULUNG",
        title: "Fachinformatiker",
        institution: "Gfn Bonn",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2025-01-01"),
        description: "Schwerpunkt React",
        sortOrder: 0,
        preferencesId: "default",
      },
    ],
    projectEntries: [
      {
        id: "proj-1",
        title: "electroCheck-ai",
        description: "KI Prüfplattform",
        techStack: "TypeScript,React",
        url: "https://example.com",
        role: "Entwickler",
        sortOrder: 0,
        preferencesId: "default",
      },
    ],
  };

  it("exportiert Profil in das standardkonforme JSON-Resume Format", () => {
    const jsonResume = exportToJsonResume(mockPreferences);

    expect(jsonResume.basics.name).toBe("Alexander Schepp");
    expect(jsonResume.basics.label).toBe("Fachinformatiker für Anwendungsentwicklung");
    expect(jsonResume.basics.location?.city).toBe("Bonn");
    expect(jsonResume.skills?.[0]?.keywords).toContain("TypeScript");
    expect(jsonResume.projects?.[0]?.name).toBe("electroCheck-ai");
  });

  it("parst ein standardisiertes JSON-Resume Objekt zurück in interne Datenstrukturen", () => {
    const schema: JsonResumeSchema = {
      basics: {
        name: "Max Mustermann",
        label: "Frontend Entwickler",
        email: "max@example.com",
        location: { city: "Köln" },
      },
      skills: [{ name: "Tech", keywords: ["Vue.js", "JavaScript"] }],
      projects: [{ name: "Webshop", description: "E-Commerce", keywords: ["Vue", "Node"] }],
    };

    const parsed = parseJsonResumeImport(schema);
    expect(parsed.preferences.fullName).toBe("Max Mustermann");
    expect(parsed.preferences.desiredRole).toBe("Frontend Entwickler");
    expect(parsed.preferences.city).toBe("Köln");
    expect(parsed.preferences.techStack).toBe("Vue.js,JavaScript");
    expect(parsed.projects.length).toBe(1);
    expect(parsed.projects[0].title).toBe("Webshop");
  });
});
