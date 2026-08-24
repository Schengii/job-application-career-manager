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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    jobPosting: null,
    coverLetter: null,
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
});
