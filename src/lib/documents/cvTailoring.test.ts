import { describe, expect, it } from "vitest";
import { tailorCvToJob } from "@/lib/documents/cvTailoring";
import type { PreferencesWithProfile } from "@/types";

describe("cvTailoring", () => {
  const mockPreferences = {
    id: "default",
    fullName: "Alexander Schepp",
    desiredRole: "Frontend Entwickler",
    techStack: "JavaScript, HTML, Next.js, React, CSS, TypeScript, SQL",
    preferredLocations: "Bonn",
    searchRadiusKm: 50,
    remotePreference: "HYBRID",
    minSalary: 50000,
    weeklyGoal: 5,
    minMatchScore: 0,
    portfolioViewCount: 0,
    portfolioActive: true,
    backgroundSchedulerEnabled: true,
    digestEnabled: true,
    imapFolder: "INBOX",
    imapEnabled: false,
    smtpPort: 587,
    smtpSecure: false,
    updatedAt: new Date(),
    educationEntries: [],
    projectEntries: [
      {
        id: "proj-1",
        title: "Klassisches PHP Portal",
        description: "Ein altes Backend-Projekt mit PHP und SQL",
        techStack: "PHP, SQL",
        sortOrder: 1,
        preferencesId: "default",
        role: "Developer",
        url: null,
      },
      {
        id: "proj-2",
        title: "Modernes Next.js Dashboard",
        description: "Dashboard mit React 19, TypeScript und Tailwind CSS",
        techStack: "Next.js, React, TypeScript, Tailwind",
        sortOrder: 2,
        preferencesId: "default",
        role: "Lead",
        url: null,
      },
    ],
    careerProfiles: [],
  } as unknown as PreferencesWithProfile;

  it("priorisiert relevante Tech-Skills und Projekte für React/Next.js Stellen", () => {
    const result = tailorCvToJob(mockPreferences, {
      targetPosition: "Senior Frontend Engineer (React/Next.js)",
      targetTechStack: "Next.js, TypeScript, GraphQL",
      targetDescription: "Wir suchen einen Entwickler für unsere React Plattform.",
    });

    // Next.js, TypeScript & React müssen ganz vorne im tailoredTechStack stehen
    expect(result.tailoredTechStack.slice(0, 3)).toEqual(
      expect.arrayContaining(["Next.js", "TypeScript", "React"])
    );

    // proj-2 (Next.js Dashboard) muss vor proj-1 sortiert werden
    expect(result.reorderedProjectIds[0]).toBe("proj-2");
    expect(result.matchedKeywords).toContain("Next.js");
    expect(result.missingKeywords).toContain("GraphQL");
    expect(result.matchScorePct).toBeGreaterThan(50);
  });
});
