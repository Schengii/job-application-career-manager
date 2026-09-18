// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodayOverviewCard } from "./today-overview-card";
import type { ApplicationListItem } from "@/types";

describe("TodayOverviewCard", () => {
  const sampleApps: ApplicationListItem[] = [
    {
      id: "app-1",
      companyId: "comp-1",
      jobPostingId: "job-1",
      position: "Frontend Entwickler",
      status: "INTERVIEW",
      applicationDate: new Date(),
      nextStep: "Fachgespräch",
      nextStepDate: new Date(),
      meetingUrl: "https://meet.google.com/test",
      rejectionReason: null,
      interviewStage: "TECH_INTERVIEW",
      timeSpentMinutes: 30,
      tags: "React",
      notes: "Wichtige Firmennotiz zum Tech-Stack",
      source: "LinkedIn",
      createdAt: new Date(),
      updatedAt: new Date(),
      company: {
        id: "comp-1",
        name: "Acme AG",
        street: "Hauptstr. 10",
        postalCode: "53111",
        city: "Bonn",
        country: "Deutschland",
        website: "https://acme.example",
        contactName: "Frau Müller",
        contactPhone: "0228 123456",
        contactEmail: "recruiting@acme.example",
        notes: null,
        tags: null,
        status: "IN_PROGRESS",
        letterTemplate: null,
        preferredTone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      jobPosting: {
        id: "job-1",
        title: "Frontend Entwickler",
        description: "React Dev",
        portalSource: "LINKEDIN",
        sourceUrl: null,
        location: "Bonn",
        remote: true,
        requirementsProfile: null,
        techStack: "React, TypeScript, CSS",
        salaryInfo: null,
        matchScore: 90,
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
      _count: { statusEvents: 0, documents: 0 },
    },
  ];

  it("rendert die Heute-Karte mit anstehendem Termin und Spickzettel-Button", () => {
    render(<TodayOverviewCard applications={sampleApps} />);

    expect(screen.getByTestId("today-overview-card")).toBeDefined();
    expect(screen.getByText(/Spickzettel 📋/i)).toBeDefined();
    expect(screen.getByText(/Meeting/i)).toBeDefined();
  });

  it("öffnet das Quick-Sheet Modal beim Klick auf Spickzettel", () => {
    render(<TodayOverviewCard applications={sampleApps} />);

    const cheatsheetBtn = screen.getByText(/Spickzettel 📋/i);
    fireEvent.click(cheatsheetBtn);

    expect(screen.getByText(/Interview-Day Quick-Sheet/i)).toBeDefined();
    expect(screen.getAllByText("Acme AG").length).toBeGreaterThanOrEqual(2);
  });
});
