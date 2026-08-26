import { describe, it, expect } from "vitest";
import { calculateRoiAnalytics } from "./roiAnalytics";
import type { ApplicationListItem } from "@/types";

describe("roiAnalytics", () => {
  const mockApplications: ApplicationListItem[] = [
    {
      id: "app-1",
      position: "React Entwickler",
      status: "INTERVIEW",
      applicationDate: new Date(),
      nextStep: null,
      nextStepDate: null,
      meetingUrl: null,
      rejectionReason: null,
      interviewStage: null,
      timeSpentMinutes: 45,
      tags: null,
      notes: null,
      source: "LinkedIn",
      createdAt: new Date(),
      updatedAt: new Date(),
      companyId: "c1",
      jobPostingId: null,
      company: {
        id: "c1",
        name: "Firma A",
        street: null,
        postalCode: null,
        city: "Bonn",
        country: "DE",
        website: null,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        notes: null,
        status: "IN_PROGRESS",
        tags: null,
        letterTemplate: null,
        preferredTone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      jobPosting: null,
      coverLetter: null,
      statusEvents: [],
      _count: { statusEvents: 0, documents: 0 },
    },
    {
      id: "app-2",
      position: "Frontend Entwickler",
      status: "REJECTED",
      applicationDate: new Date(),
      nextStep: null,
      nextStepDate: null,
      meetingUrl: null,
      rejectionReason: null,
      interviewStage: null,
      timeSpentMinutes: 60,
      tags: null,
      notes: null,
      source: "Stepstone",
      createdAt: new Date(),
      updatedAt: new Date(),
      companyId: "c2",
      jobPostingId: null,
      company: {
        id: "c2",
        name: "Firma B",
        street: null,
        postalCode: null,
        city: "Dortmund",
        country: "DE",
        website: null,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        notes: null,
        status: "REJECTED",
        tags: null,
        letterTemplate: null,
        preferredTone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      jobPosting: null,
      coverLetter: null,
      statusEvents: [],
      _count: { statusEvents: 0, documents: 0 },
    },
  ];

  it("berechnet Zeitaufwand, Kanal-ROTI und strategische Tipps", () => {
    const result = calculateRoiAnalytics(mockApplications);

    expect(result.totalTimeInvestedMinutes).toBe(105);
    expect(result.avgMinutesPerApplication).toBe(53);
    expect(result.channelMetrics.length).toBe(2);

    const linkedIn = result.channelMetrics.find((c) => c.channel === "LinkedIn");
    expect(linkedIn).toBeDefined();
    expect(linkedIn?.interviewsCount).toBe(1);
    expect(linkedIn?.interviewRate).toBe(100);

    expect(result.strategicTips.length).toBeGreaterThan(0);
  });
});
