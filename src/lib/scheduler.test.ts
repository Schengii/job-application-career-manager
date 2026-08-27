import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runSchedulerTick, startBackgroundScheduler, stopBackgroundScheduler } from "./scheduler";

// vi.mock()-Aufrufe werden von Vitest an den Anfang der Datei gehoisted,
// greifen also bereits für den obigen Import von "./scheduler".
const mockGetOrCreatePreferences = vi.fn();
vi.mock("./preferences", () => ({
  getOrCreatePreferences: () => mockGetOrCreatePreferences(),
}));

const mockFindMany = vi.fn().mockResolvedValue([]);
vi.mock("./prisma", () => ({
  prisma: { application: { findMany: (...args: unknown[]) => mockFindMany(...args) } },
}));

const mockFetchInboxMessages = vi.fn();
vi.mock("./imapClient", () => ({
  fetchInboxMessages: (...args: unknown[]) => mockFetchInboxMessages(...args),
}));

const mockProcessSyncedEmails = vi.fn();
vi.mock("./emailImapSync", () => ({
  processSyncedEmails: (...args: unknown[]) => mockProcessSyncedEmails(...args),
}));

const mockSendDueNotifications = vi.fn();
const mockSendEmailMatchNotifications = vi.fn();
vi.mock("./pushNotifications", () => ({
  sendDueNotifications: () => mockSendDueNotifications(),
  sendEmailMatchNotifications: (...args: unknown[]) => mockSendEmailMatchNotifications(...args),
}));

function basePreferences(overrides: Partial<{ backgroundSchedulerEnabled: boolean; imapEnabled: boolean }> = {}) {
  return { backgroundSchedulerEnabled: true, imapEnabled: false, ...overrides };
}

describe("runSchedulerTick", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockSendDueNotifications.mockResolvedValue({ sent: 0, skipped: 0 });
    mockSendEmailMatchNotifications.mockResolvedValue({ sent: 0, skipped: 0 });
    mockFetchInboxMessages.mockResolvedValue({ messages: [], usedRealImap: true });
    mockProcessSyncedEmails.mockReturnValue({ matchedActions: [], unmatchedEmails: [], totalEmailsScanned: 0, syncedAt: "" });
  });

  it("führt weder E-Mail-Sync noch Push-Versand aus, wenn der Scheduler deaktiviert ist", async () => {
    mockGetOrCreatePreferences.mockResolvedValue(basePreferences({ backgroundSchedulerEnabled: false }));

    await runSchedulerTick();

    expect(mockFetchInboxMessages).not.toHaveBeenCalled();
    expect(mockSendDueNotifications).not.toHaveBeenCalled();
  });

  it("überspringt den E-Mail-Sync bei deaktiviertem IMAP, führt aber weiterhin sendDueNotifications aus", async () => {
    mockGetOrCreatePreferences.mockResolvedValue(basePreferences({ imapEnabled: false }));

    await runSchedulerTick();

    expect(mockFetchInboxMessages).not.toHaveBeenCalled();
    expect(mockSendDueNotifications).toHaveBeenCalledOnce();
  });

  it("führt bei aktiviertem IMAP den E-Mail-Sync aus und verschickt Treffer-Benachrichtigungen", async () => {
    mockGetOrCreatePreferences.mockResolvedValue(basePreferences({ imapEnabled: true }));
    const matchedActions = [{ statusChanged: true }];
    mockProcessSyncedEmails.mockReturnValue({ matchedActions, unmatchedEmails: [], totalEmailsScanned: 1, syncedAt: "" });

    await runSchedulerTick();

    expect(mockFetchInboxMessages).toHaveBeenCalledOnce();
    expect(mockSendEmailMatchNotifications).toHaveBeenCalledWith(matchedActions);
    expect(mockSendDueNotifications).toHaveBeenCalledOnce();
  });

  it("überspringt den E-Mail-Sync, wenn fetchInboxMessages auf die Sample-Inbox zurückgefallen ist (kein echtes IMAP)", async () => {
    mockGetOrCreatePreferences.mockResolvedValue(basePreferences({ imapEnabled: true }));
    mockFetchInboxMessages.mockResolvedValue({ messages: [], usedRealImap: false });

    await runSchedulerTick();

    expect(mockProcessSyncedEmails).not.toHaveBeenCalled();
    expect(mockSendEmailMatchNotifications).not.toHaveBeenCalled();
    expect(mockSendDueNotifications).toHaveBeenCalledOnce();
  });

  it("bricht den Tick nicht komplett ab, wenn sendDueNotifications wirft", async () => {
    mockGetOrCreatePreferences.mockResolvedValue(basePreferences());
    mockSendDueNotifications.mockRejectedValue(new Error("Push-Dienst nicht erreichbar"));

    await expect(runSchedulerTick()).resolves.toBeUndefined();
  });
});

describe("startBackgroundScheduler / stopBackgroundScheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrCreatePreferences.mockResolvedValue(basePreferences());
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopBackgroundScheduler();
    vi.useRealTimers();
  });

  it("registriert bei wiederholtem Aufruf nur EINEN Timer (Schutz gegen Dev-Hot-Reload-Doppelstart)", () => {
    const setIntervalSpy = vi.spyOn(global, "setInterval");

    startBackgroundScheduler();
    startBackgroundScheduler();
    startBackgroundScheduler();

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it("führt beim Start sofort einen ersten Tick aus, statt auf das Intervall zu warten", async () => {
    startBackgroundScheduler();
    await vi.waitFor(() => expect(mockGetOrCreatePreferences).toHaveBeenCalled());
  });

  it("stopBackgroundScheduler() erlaubt einen erneuten Start mit neuem Timer", () => {
    const setIntervalSpy = vi.spyOn(global, "setInterval");

    startBackgroundScheduler();
    stopBackgroundScheduler();
    startBackgroundScheduler();

    expect(setIntervalSpy).toHaveBeenCalledTimes(2);
  });
});
