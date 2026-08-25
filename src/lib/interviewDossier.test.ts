import { describe, it, expect } from "vitest";
import { generateInterviewDossierHtml } from "./interviewDossier";
import type { ApplicationDetail, PreferencesWithProfile } from "@/types";

describe("interviewDossier generator", () => {
  const mockApplication: ApplicationDetail = {
    id: "app-123",
    position: "Frontend Entwickler (React/TypeScript)",
    status: "INTERVIEW",
    applicationDate: new Date("2026-08-01"),
    nextStep: "Technisches Fachgespräch",
    nextStepDate: new Date("2026-08-28T14:00:00Z"),
    meetingUrl: "https://teams.microsoft.com/l/meetup-join/123",
    notes: "Gespräch mit dem Teamleiter und Lead Developer. Fokus auf React 19 & State Management.",
    source: "Stepstone",
    tags: "Prio1,Frontend",
    rejectionReason: null,
    interviewStage: "TECH_INTERVIEW",
    timeSpentMinutes: 45,
    createdAt: new Date(),
    updatedAt: new Date(),
    companyId: "comp-1",
    jobPostingId: "job-1",
    company: {
      id: "comp-1",
      name: "Tech Solutions GmbH",
      street: "Hauptstraße 42",
      postalCode: "53111",
      city: "Bonn",
      country: "Deutschland",
      website: "https://tech-solutions.example",
      contactName: "Dr. Julia Weber",
      contactEmail: "julia.weber@tech-solutions.example",
      contactPhone: "+49 228 123456",
      notes: "Innovatives Softwarehaus im Rheinland",
      tags: "Startup,Modern",
      status: "IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    jobPosting: {
      id: "job-1",
      title: "Frontend Entwickler (React/TypeScript)",
      description: "Wir suchen einen motivierten Frontend Entwickler mit Erfahrung in React und TypeScript.",
      portalSource: "STEPSTONE",
      sourceUrl: "https://stepstone.de/job/123",
      location: "Bonn (Hybrid)",
      remote: true,
      requirementsProfile: "React, TypeScript, Next.js",
      techStack: "TypeScript, React, Next.js, Tailwind, Vitest",
      salaryInfo: "48.000 € - 54.000 €",
      matchScore: 92,
      isDismissed: false,
      dismissReason: null,
      dismissedAt: null,
      postedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      companyId: "comp-1",
    },
    coverLetter: null,
    statusEvents: [],
    interactions: [],
    documents: [],
  };

  const mockPreferences: PreferencesWithProfile = {
    id: "default",
    fullName: "Max Mustermann",
    email: "max@example.com",
    phone: "0170 1234567",
    street: "Musterweg 1",
    postalCode: "53113",
    city: "Bonn",
    desiredRole: "Fachinformatiker für Anwendungsentwicklung",
    techStack: "TypeScript, JavaScript, CSS, React, Next.js, HTML",
    preferredLocations: "Bonn, Dortmund, Remote",
    searchRadiusKm: 50,
    remotePreference: "HYBRID",
    minSalary: 45000,
    profileSummary: "Motivierter Frontend Entwickler",
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
    updatedAt: new Date(),
    educationEntries: [],
    projectEntries: [],
  };

  it("generates a complete HTML document with company, meetingUrl, techStack and notes", () => {
    const html = generateInterviewDossierHtml(mockApplication, mockPreferences);
    expect(html).toContain("Interview-Dossier");
    expect(html).toContain("Tech Solutions GmbH");
    expect(html).toContain("Dr. Julia Weber");
    expect(html).toContain("Frontend Entwickler (React/TypeScript)");
    expect(html).toContain("https://teams.microsoft.com/l/meetup-join/123");
    expect(html).toContain("React 19 &amp; State Management");
    expect(html).toContain("TypeScript");
    expect(html).toContain("Max Mustermann");
  });

  it("respects options to exclude employer questions or salary levers", () => {
    const html = generateInterviewDossierHtml(mockApplication, mockPreferences, {
      includeEmployerQuestions: false,
      includeSalaryLevers: false,
      includeChecklist: true,
    });
    expect(html).not.toContain("Empfohlene Gegenfragen an den Arbeitgeber");
    expect(html).not.toContain("Gehalts- &amp; Verhandlungsargumente");
    expect(html).toContain("Interview-Checkliste");
  });
});
