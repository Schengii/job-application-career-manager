import { describe, expect, it } from "vitest";
import { getNotificationsFromApplications } from "./notifications";
import type { ApplicationListItem } from "@/types";

describe("notifications", () => {
  const dummyApp = (overrides: Partial<ApplicationListItem> = {}): ApplicationListItem => ({
    id: "app-1",
    companyId: "comp-1",
    jobPostingId: null,
    position: "Frontend Entwickler",
    status: "SENT",
    applicationDate: new Date(),
    nextStep: null,
    nextStepDate: null,
    meetingUrl: null,
    rejectionReason: null,
    interviewStage: null,
    timeSpentMinutes: 0,
    tags: null,
    notes: null,
    source: "Stepstone",
    createdAt: new Date(),
    updatedAt: new Date(),
    company: {
      id: "comp-1",
      name: "Tech Corp",
      street: null,
      postalCode: null,
      city: "Bonn",
      country: "Deutschland",
      website: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      notes: null,
      status: "CONTACTED",
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
    ...overrides,
  });

  it("erzeugt eine Nachfass-Benachrichtigung bei Bewerbungen älter als 14 Tage", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 20);

    const app = dummyApp({ applicationDate: oldDate });
    const notifs = getNotificationsFromApplications([app]);

    expect(notifs.length).toBe(1);
    expect(notifs[0].type).toBe("FOLLOW_UP");
    expect(notifs[0].companyName).toBe("Tech Corp");
  });

  it("erzeugt eine Termin-Benachrichtigung bei anstehenden Terminen", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const app = dummyApp({ nextStep: "Vorstellungsgespräch", nextStepDate: tomorrow });
    const notifs = getNotificationsFromApplications([app]);

    expect(notifs.some((n) => n.type === "DUE_SOON")).toBe(true);
  });

  it("filtert verworfene Benachrichtigungen (dismissedIds) heraus", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 20);

    const app = dummyApp({ applicationDate: oldDate });
    const notifs = getNotificationsFromApplications([app], ["followup-app-1"]);

    expect(notifs.length).toBe(0);
  });

  it("erzeugt eine Absage-Benachrichtigung, wenn der letzte Status-Event 'REJECTED' ist", () => {
    const app = dummyApp({
      status: "REJECTED",
      statusEvents: [{ id: "evt-1", status: "REJECTED", changedAt: new Date() }],
    });
    const notifs = getNotificationsFromApplications([app]);

    expect(notifs.some((n) => n.type === "REJECTED" && n.id === "status-evt-1")).toBe(true);
  });

  it("erzeugt eine Zusage-Benachrichtigung mit hoher Priorität, wenn der letzte Status-Event 'OFFER' ist", () => {
    const app = dummyApp({
      status: "OFFER",
      statusEvents: [{ id: "evt-2", status: "OFFER", changedAt: new Date() }],
    });
    const notifs = getNotificationsFromApplications([app]);
    const offerNotif = notifs.find((n) => n.type === "OFFER");

    expect(offerNotif).toBeDefined();
    expect(offerNotif?.priority).toBe("high");
  });

  it("erzeugt KEINE Status-Benachrichtigung, wenn der letzte Status-Event nicht mehr dem aktuellen Status entspricht", () => {
    // Bewerbung wurde nach einer (fälschlich erkannten) Absage manuell wieder auf SENT gesetzt.
    const app = dummyApp({
      status: "SENT",
      applicationDate: new Date(),
      statusEvents: [{ id: "evt-3", status: "REJECTED", changedAt: new Date() }],
    });
    const notifs = getNotificationsFromApplications([app]);

    expect(notifs.some((n) => n.type === "REJECTED")).toBe(false);
  });

  it("blendet eine bereits verworfene Status-Benachrichtigung dauerhaft aus", () => {
    const app = dummyApp({
      status: "OFFER",
      statusEvents: [{ id: "evt-4", status: "OFFER", changedAt: new Date() }],
    });
    const notifs = getNotificationsFromApplications([app], ["status-evt-4"]);

    expect(notifs.some((n) => n.type === "OFFER")).toBe(false);
  });
});
