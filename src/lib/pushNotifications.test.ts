import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendDueNotifications, sendEmailMatchNotifications, sendPushToSubscription, sendWeeklyDigestIfDue } from "./pushNotifications";
import { resetDb, createTestCompany } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";
import type { MatchedEmailAction } from "./emailImapSync";
import type { ApplicationListItem } from "@/types";

const mockSendNotification = vi.fn();
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  },
}));

// vapidKeys.ts erzeugt ohne ENV-Vars automatisch ein Schlüsselpaar und
// schreibt es nach .vapid-keys.json — hier gemockt, damit Tests weder
// Dateisystem-Nebenwirkungen haben noch echte Schlüssel generieren müssen.
vi.mock("./vapidKeys", () => ({
  getVapidKeys: () => ({ publicKey: "test-public-key", privateKey: "test-private-key" }),
}));

async function createSubscription(endpoint = "https://push.example.com/abc") {
  return prisma.pushSubscription.create({
    data: { endpoint, p256dh: "p256dh-value", auth: "auth-value" },
  });
}

describe("sendPushToSubscription", () => {
  beforeEach(async () => {
    await resetDb();
    mockSendNotification.mockReset();
  });

  it("liefert true und behält die Subscription bei erfolgreichem Versand", async () => {
    mockSendNotification.mockResolvedValueOnce({ statusCode: 201 });
    const sub = await createSubscription();

    const ok = await sendPushToSubscription(sub, { title: "Test", body: "Nachricht" });

    expect(ok).toBe(true);
    expect(await prisma.pushSubscription.count()).toBe(1);
  });

  it("entfernt die Subscription automatisch bei HTTP 410 (Gone)", async () => {
    mockSendNotification.mockRejectedValueOnce(Object.assign(new Error("Gone"), { statusCode: 410 }));
    const sub = await createSubscription();

    const ok = await sendPushToSubscription(sub, { title: "Test", body: "Nachricht" });

    expect(ok).toBe(false);
    expect(await prisma.pushSubscription.count()).toBe(0);
  });

  it("behält die Subscription bei einem anderen Fehler (z.B. 500 beim Push-Dienst)", async () => {
    mockSendNotification.mockRejectedValueOnce(Object.assign(new Error("Server Error"), { statusCode: 500 }));
    const sub = await createSubscription();

    const ok = await sendPushToSubscription(sub, { title: "Test", body: "Nachricht" });

    expect(ok).toBe(false);
    expect(await prisma.pushSubscription.count()).toBe(1);
  });
});

describe("sendDueNotifications", () => {
  beforeEach(async () => {
    await resetDb();
    mockSendNotification.mockReset();
    mockSendNotification.mockResolvedValue({ statusCode: 201 });
  });

  it("verschickt nichts, wenn keine Benachrichtigungen fällig sind", async () => {
    await createSubscription();
    const result = await sendDueNotifications();
    expect(result).toEqual({ sent: 0, skipped: 0 });
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("verschickt eine fällige Statuswechsel-Benachrichtigung an alle Subscriptions und dedupliziert beim zweiten Lauf", async () => {
    await createSubscription("https://push.example.com/device-1");
    await createSubscription("https://push.example.com/device-2");
    const company = await createTestCompany();
    const app = await prisma.application.create({
      data: { position: "Frontend-Entwickler", status: "OFFER", companyId: company.id },
    });
    await prisma.applicationStatusEvent.create({
      data: { applicationId: app.id, status: "OFFER" },
    });

    const first = await sendDueNotifications();
    expect(first.sent).toBe(2); // 1 Benachrichtigung x 2 Subscriptions
    expect(await prisma.sentPushNotification.count()).toBe(1);

    mockSendNotification.mockClear();
    const second = await sendDueNotifications();
    expect(second).toEqual({ sent: 0, skipped: 1 });
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("verschickt eine fällige Benachrichtigung bei zeitlich überlappenden Aufrufen nur EINMAL (kein Duplikat-Versand)", async () => {
    // Regressionstest für ein Check-then-Act-Rennen: sendDueNotifications()
    // wird von 3 unsynchronisierten Stellen aufgerufen (Scheduler-Tick,
    // Statuswechsel-Route, E-Mail-Sync-Route). Laufen zwei Aufrufe
    // überlappend, dürfen sie NICHT beide dieselbe (noch nicht als gesendet
    // markierte) Benachrichtigung an alle Subscriptions verschicken.
    await createSubscription("https://push.example.com/device-1");
    await createSubscription("https://push.example.com/device-2");
    const company = await createTestCompany();
    const app = await prisma.application.create({
      data: { position: "Frontend-Entwickler", status: "OFFER", companyId: company.id },
    });
    await prisma.applicationStatusEvent.create({
      data: { applicationId: app.id, status: "OFFER" },
    });

    const [first, second] = await Promise.all([sendDueNotifications(), sendDueNotifications()]);

    // Zusammen genau 2 Sends (1 Benachrichtigung x 2 Subscriptions) — nicht 4.
    expect(first.sent + second.sent).toBe(2);
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
    expect(await prisma.sentPushNotification.count()).toBe(1);
  });

  it("markiert eine fällige Benachrichtigung auch ohne registrierte Subscription als bearbeitet", async () => {
    const company = await createTestCompany();
    const app = await prisma.application.create({
      data: { position: "Frontend-Entwickler", status: "REJECTED", companyId: company.id },
    });
    await prisma.applicationStatusEvent.create({
      data: { applicationId: app.id, status: "REJECTED" },
    });

    const result = await sendDueNotifications();
    expect(result.sent).toBe(0);
    expect(await prisma.sentPushNotification.count()).toBe(1);
  });
});

function makeMatchedAction(overrides: { appId: string; emailId: string; statusChanged: boolean }): MatchedEmailAction {
  return {
    email: { id: overrides.emailId, from: "a@b.de", subject: "Einladung zum Gespräch", date: "", snippet: "", fullBody: "" },
    application: { id: overrides.appId, company: { name: "Acme GmbH" } } as unknown as ApplicationListItem,
    parsed: {
      detectedStatus: "INTERVIEW",
      statusLabel: "Einladung zum Gespräch",
      confidence: "HIGH",
      suggestedAction: "Termin bestätigen",
      reasoning: "Testfixture",
    },
    suggestedStatus: "INTERVIEW",
    statusChanged: overrides.statusChanged,
    confidenceScore: 90,
  };
}

describe("sendEmailMatchNotifications", () => {
  beforeEach(async () => {
    await resetDb();
    mockSendNotification.mockReset();
    mockSendNotification.mockResolvedValue({ statusCode: 201 });
  });

  it("verschickt nichts für E-Mail-Treffer ohne vorgeschlagenen Statuswechsel", async () => {
    await createSubscription();
    const result = await sendEmailMatchNotifications([
      makeMatchedAction({ appId: "app-1", emailId: "msg-1", statusChanged: false }),
    ]);
    expect(result).toEqual({ sent: 0, skipped: 0 });
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("verschickt eine Benachrichtigung pro (Bewerbung, E-Mail) und dedupliziert beim zweiten Lauf", async () => {
    await createSubscription();
    const actions = [makeMatchedAction({ appId: "app-1", emailId: "msg-1", statusChanged: true })];

    const first = await sendEmailMatchNotifications(actions);
    expect(first).toEqual({ sent: 1, skipped: 0 });

    mockSendNotification.mockClear();
    const second = await sendEmailMatchNotifications(actions);
    expect(second).toEqual({ sent: 0, skipped: 1 });
    expect(mockSendNotification).not.toHaveBeenCalled();
  });
});

describe("sendWeeklyDigestIfDue", () => {
  beforeEach(async () => {
    await resetDb();
    mockSendNotification.mockReset();
    mockSendNotification.mockResolvedValue({ statusCode: 201 });
  });

  it("verschickt nichts und setzt lastDigestSentAt nicht, wenn in den Einstellungen deaktiviert", async () => {
    await createSubscription();
    await prisma.preferences.create({ data: { id: "default", digestEnabled: false } });

    const result = await sendWeeklyDigestIfDue();
    expect(result).toEqual({ sent: false, sentCount: 0 });
    expect(mockSendNotification).not.toHaveBeenCalled();

    const preferences = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(preferences?.lastDigestSentAt).toBeNull();
  });

  it("markiert den Digest als verschickt, verschickt aber keinen Push bei leerem Trichter", async () => {
    await createSubscription();
    await prisma.preferences.create({ data: { id: "default" } }); // digestEnabled: true (Default)

    const result = await sendWeeklyDigestIfDue();
    expect(result).toEqual({ sent: false, sentCount: 0 });
    expect(mockSendNotification).not.toHaveBeenCalled();

    const preferences = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(preferences?.lastDigestSentAt).not.toBeNull();
  });

  it("verschickt eine zusammenfassende Push-Benachrichtigung an alle Subscriptions", async () => {
    await createSubscription("https://push.example.com/device-1");
    await createSubscription("https://push.example.com/device-2");
    await prisma.preferences.create({ data: { id: "default" } });

    const company = await createTestCompany();
    await prisma.application.create({
      data: { position: "Frontend-Entwickler", status: "OFFER", companyId: company.id },
    });
    await prisma.applicationStatusEvent.create({
      // applicationId wird über die zuvor angelegte Application referenziert
      data: {
        applicationId: (await prisma.application.findFirstOrThrow()).id,
        status: "OFFER",
      },
    });

    const result = await sendWeeklyDigestIfDue();
    expect(result.sent).toBe(true);
    expect(result.sentCount).toBe(2);
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
  });

  it("verschickt nichts, wenn der letzte Digest vor weniger als 7 Tagen verschickt wurde", async () => {
    await createSubscription();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await prisma.preferences.create({ data: { id: "default", lastDigestSentAt: twoDaysAgo } });

    const company = await createTestCompany();
    await prisma.application.create({
      data: { position: "Frontend-Entwickler", status: "OFFER", companyId: company.id },
    });

    const result = await sendWeeklyDigestIfDue();
    expect(result).toEqual({ sent: false, sentCount: 0 });
    expect(mockSendNotification).not.toHaveBeenCalled();
  });
});
