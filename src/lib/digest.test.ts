import { describe, expect, it } from "vitest";
import { buildWeeklyDigest, isWeeklyDigestDue } from "./digest";
import type { NotificationSourceApplication } from "./notifications";

function baseApp(overrides: Partial<NotificationSourceApplication> = {}): NotificationSourceApplication {
  return {
    id: "app-1",
    status: "SENT",
    position: "Frontend-Entwickler",
    applicationDate: null,
    nextStepDate: null,
    nextStep: null,
    company: { name: "Beispiel GmbH" },
    statusEvents: [],
    ...overrides,
  };
}

describe("buildWeeklyDigest", () => {
  it("liefert null, wenn es nichts zu berichten gibt", () => {
    expect(buildWeeklyDigest([baseApp()])).toBeNull();
  });

  it("fasst einen überfälligen Termin in der Zusammenfassung zusammen", () => {
    const overdueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const digest = buildWeeklyDigest([
      baseApp({ nextStep: "Rückmeldung abwarten", nextStepDate: overdueDate }),
    ]);

    expect(digest).not.toBeNull();
    expect(digest?.overdueCount).toBe(1);
    expect(digest?.body).toContain("überfällig");
  });

  it("zählt mehrere Kategorien (Rückmeldung + Nachfassen) korrekt zusammen", () => {
    const oldApplicationDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    const digest = buildWeeklyDigest([
      baseApp({ id: "app-1", applicationDate: oldApplicationDate }), // -> follow-up empfohlen
      baseApp({
        id: "app-2",
        status: "OFFER",
        statusEvents: [{ id: "ev-1", status: "OFFER", changedAt: new Date() }],
      }),
    ]);

    expect(digest).not.toBeNull();
    expect(digest?.followUpCount).toBe(1);
    expect(digest?.responseCount).toBe(1);
    expect(digest?.totalCount).toBe(2);
  });
});

describe("isWeeklyDigestDue", () => {
  it("ist fällig, wenn noch nie ein Digest verschickt wurde", () => {
    expect(isWeeklyDigestDue({ digestEnabled: true, lastDigestSentAt: null })).toBe(true);
  });

  it("ist NICHT fällig, wenn in den Einstellungen deaktiviert", () => {
    expect(isWeeklyDigestDue({ digestEnabled: false, lastDigestSentAt: null })).toBe(false);
  });

  it("ist NICHT fällig, wenn der letzte Versand weniger als 7 Tage her ist", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(isWeeklyDigestDue({ digestEnabled: true, lastDigestSentAt: twoDaysAgo })).toBe(false);
  });

  it("ist wieder fällig, wenn der letzte Versand mindestens 7 Tage her ist", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    expect(isWeeklyDigestDue({ digestEnabled: true, lastDigestSentAt: eightDaysAgo })).toBe(true);
  });
});
