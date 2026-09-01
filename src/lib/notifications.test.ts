import { describe, expect, it } from "vitest";
import { getNotificationsFromApplications, getEmailSuggestionNotifications, type PendingEmailSuggestion } from "./notifications";
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
    const [notif] = getNotificationsFromApplications([app]);
    expect(notif).toBeDefined();

    const notifsAfterDismiss = getNotificationsFromApplications([app], [notif.id]);
    expect(notifsAfterDismiss.length).toBe(0);
  });

  it("erzeugt nach einer Terminverschiebung eine neue, nicht mehr durch die alte dismissedId gedeckte Überfällig-Benachrichtigung", () => {
    // Regressionstest für einen Bug: die Dedup-/Dismiss-ID basierte früher
    // NUR auf der Application-ID (`overdue-${app.id}`), nicht auf dem
    // konkreten Termin — eine einmal gesendete/verworfene Benachrichtigung
    // blieb dadurch nach einer Terminverschiebung für immer unterdrückt,
    // obwohl der neue Termin einen eigenständigen Hinweis verdient.
    const firstDueDate = new Date();
    firstDueDate.setDate(firstDueDate.getDate() - 2);
    const appBeforeReschedule = dummyApp({ nextStep: "Rückmeldung einholen", nextStepDate: firstDueDate });
    const [firstNotif] = getNotificationsFromApplications([appBeforeReschedule]).filter((n) => n.type === "OVERDUE");
    expect(firstNotif).toBeDefined();

    const rescheduledDate = new Date();
    rescheduledDate.setDate(rescheduledDate.getDate() - 5);
    const appAfterReschedule = dummyApp({ nextStep: "Rückmeldung einholen", nextStepDate: rescheduledDate });
    const notifsAfterReschedule = getNotificationsFromApplications([appAfterReschedule], [firstNotif.id]);

    expect(notifsAfterReschedule.some((n) => n.type === "OVERDUE")).toBe(true);
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

describe("getEmailSuggestionNotifications", () => {
  const dummySuggestion = (overrides: Partial<PendingEmailSuggestion> = {}): PendingEmailSuggestion => ({
    id: "sugg-1",
    applicationId: "app-1",
    statusLabel: "Einladung zum Vorstellungsgespräch",
    emailDate: new Date(),
    application: { position: "Frontend Entwickler", company: { name: "Tech Corp" } },
    ...overrides,
  });

  it("erzeugt eine EMAIL_SUGGESTION-Benachrichtigung für einen offenen Vorschlag", () => {
    const notifs = getEmailSuggestionNotifications([dummySuggestion()]);

    expect(notifs.length).toBe(1);
    expect(notifs[0].type).toBe("EMAIL_SUGGESTION");
    expect(notifs[0].id).toBe("email-suggestion-sugg-1");
    expect(notifs[0].companyName).toBe("Tech Corp");
  });

  it("filtert bereits verworfene Vorschlags-Benachrichtigungen (dismissedIds) heraus", () => {
    const notifs = getEmailSuggestionNotifications([dummySuggestion()], ["email-suggestion-sugg-1"]);

    expect(notifs.length).toBe(0);
  });
});
