import { describe, it, expect } from "vitest";
import { matchEmailToApplication, processSyncedEmails } from "./emailImapSync";
import type { ApplicationListItem } from "@/types";

describe("emailImapSync", () => {
  const mockApplication: ApplicationListItem = {
    id: "app-1",
    position: "Frontend Entwickler React",
    status: "SENT",
    applicationDate: new Date(),
    nextStep: "Rückmeldung abwarten",
    nextStepDate: null,
    meetingUrl: null,
    rejectionReason: null,
    interviewStage: null,
    timeSpentMinutes: 30,
    tags: "Prio1",
    notes: null,
    source: "Stepstone",
    createdAt: new Date(),
    updatedAt: new Date(),
    companyId: "comp-1",
    jobPostingId: null,
    company: {
      id: "comp-1",
      name: "adesso SE",
      street: "Adessoplatz 1",
      postalCode: "44269",
      city: "Dortmund",
      country: "Deutschland",
      website: "https://adesso.de",
      contactName: "Frau Müller",
      contactEmail: "recruiting@adesso.de",
      contactPhone: null,
      notes: null,
      tags: null,
      status: "IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    jobPosting: null,
    coverLetter: null,
    _count: { statusEvents: 1, documents: 0 },
  };

  it("matched eingehende E-Mails zuverlässig anhand von Absender und Firmenname", () => {
    const email = {
      id: "email-1",
      from: "recruiting@adesso.de",
      subject: "Einladung zum Vorstellungsgespräch: Frontend Entwickler",
      date: new Date().toISOString(),
      snippet: "Wir laden Sie herzlich ein...",
      fullBody: "Sehr geehrter Herr Schepp, wir laden Sie zum Vorstellungsgespräch ein...",
    };

    const match = matchEmailToApplication(email, [mockApplication]);
    expect(match).not.toBeNull();
    expect(match?.application.id).toBe("app-1");
    expect(match?.confidence).toBeGreaterThanOrEqual(60);
  });

  it("erkennt Statusübergänge automatisch (z.B. Einladung -> INTERVIEW)", () => {
    const emails = [
      {
        id: "email-1",
        from: "recruiting@adesso.de",
        subject: "Einladung zum Vorstellungsgespräch",
        date: new Date().toISOString(),
        snippet: "Termin nächste Woche",
        fullBody: "Wir laden Sie herzlich zum Vorstellungsgespräch via Teams ein: https://teams.microsoft.com/meet",
      },
    ];

    const result = processSyncedEmails(emails, [mockApplication]);
    expect(result.matchedActions.length).toBe(1);
    expect(result.matchedActions[0].suggestedStatus).toBe("INTERVIEW");
    expect(result.matchedActions[0].statusChanged).toBe(true);
  });
});
