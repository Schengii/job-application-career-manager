import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchInboxMessages, hasImapCredentials } from "@/lib/email/imapClient";
import type { ApplicationListItem } from "@/types";

// imapflow & mailparser sind reine Server-Netzwerk-/Parsing-Bibliotheken —
// hier gemockt, damit Tests weder eine echte IMAP-Verbindung aufbauen noch
// echte MIME-Nachrichten parsen müssen.
const mockConnect = vi.fn();
const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockRelease = vi.fn();
const mockGetMailboxLock = vi.fn().mockResolvedValue({ release: mockRelease });
let fetchResults: { uid: number; source: Buffer }[] = [];

vi.mock("imapflow", () => ({
  // Arrow functions können nicht mit `new` aufgerufen werden — der
  // Produktionscode ruft `new ImapFlow(...)` auf, daher hier bewusst eine
  // normale `function`, die ihr Rückgabeobjekt anstelle von `this` liefert.
  ImapFlow: vi.fn().mockImplementation(function () {
    return {
      connect: mockConnect,
      getMailboxLock: mockGetMailboxLock,
      logout: mockLogout,
      fetch: async function* () {
        for (const item of fetchResults) yield item;
      },
    };
  }),
}));

vi.mock("mailparser", () => ({
  simpleParser: vi.fn().mockResolvedValue({
    from: { text: "recruiting@acme.de" },
    subject: "Einladung zum Gespräch",
    date: new Date("2026-01-10T10:00:00.000Z"),
    text: "Wir laden Sie herzlich ein.",
  }),
}));

function makeApp(id: string, companyName: string): ApplicationListItem {
  return {
    id,
    status: "SENT",
    position: "Frontend Entwickler",
    company: { name: companyName },
  } as unknown as ApplicationListItem;
}

describe("hasImapCredentials", () => {
  it("liefert false, wenn IMAP deaktiviert ist", () => {
    expect(
      hasImapCredentials({ imapEnabled: false, imapHost: "imap.gmail.com", imapUser: "a@b.de", imapPassword: "x" })
    ).toBe(false);
  });

  it("liefert false, wenn Host/User/Passwort fehlen", () => {
    expect(hasImapCredentials({ imapEnabled: true, imapHost: null, imapUser: "a@b.de", imapPassword: "x" })).toBe(false);
    expect(hasImapCredentials({ imapEnabled: true, imapHost: "imap.gmail.com", imapUser: null, imapPassword: "x" })).toBe(
      false
    );
    expect(
      hasImapCredentials({ imapEnabled: true, imapHost: "imap.gmail.com", imapUser: "a@b.de", imapPassword: null })
    ).toBe(false);
  });

  it("liefert true, wenn alle Angaben vorhanden sind", () => {
    expect(
      hasImapCredentials({ imapEnabled: true, imapHost: "imap.gmail.com", imapUser: "a@b.de", imapPassword: "x" })
    ).toBe(true);
  });
});

describe("fetchInboxMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockReset().mockResolvedValue(undefined);
    mockLogout.mockReset().mockResolvedValue(undefined);
    mockGetMailboxLock.mockReset().mockResolvedValue({ release: mockRelease });
    fetchResults = [];
  });

  it("fällt ohne vollständige IMAP-Konfiguration auf die Sample-Inbox zurück, ohne eine Verbindung zu versuchen", async () => {
    const apps = [makeApp("1", "Acme GmbH")];
    const result = await fetchInboxMessages(
      { imapEnabled: false, imapHost: null, imapPort: null, imapUser: null, imapPassword: null, imapFolder: null },
      apps
    );

    expect(result.usedRealImap).toBe(false);
    expect(result.messages.length).toBeGreaterThan(0);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("fällt bei einem Verbindungsfehler auf die Sample-Inbox zurück, statt zu werfen", async () => {
    mockConnect.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const apps = [makeApp("1", "Acme GmbH")];

    const result = await fetchInboxMessages(
      {
        imapEnabled: true,
        imapHost: "imap.example.com",
        imapPort: 993,
        imapUser: "user@example.com",
        imapPassword: "wrong-password",
        imapFolder: "INBOX",
      },
      apps
    );

    expect(result.usedRealImap).toBe(false);
    expect(result.messages.length).toBeGreaterThan(0);
  });

  it("liefert bei erfolgreicher Verbindung echte, per mailparser geparste Nachrichten", async () => {
    fetchResults = [{ uid: 42, source: Buffer.from("raw-mime-message") }];
    const apps = [makeApp("1", "Acme GmbH")];

    const result = await fetchInboxMessages(
      {
        imapEnabled: true,
        imapHost: "imap.example.com",
        imapPort: 993,
        imapUser: "user@example.com",
        imapPassword: "correct-password",
        imapFolder: "INBOX",
      },
      apps
    );

    expect(result.usedRealImap).toBe(true);
    expect(result.messages).toEqual([
      {
        id: "42",
        from: "recruiting@acme.de",
        subject: "Einladung zum Gespräch",
        date: "2026-01-10T10:00:00.000Z",
        snippet: "Wir laden Sie herzlich ein.",
        fullBody: "Wir laden Sie herzlich ein.",
      },
    ]);
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockRelease).toHaveBeenCalledOnce();
  });
});
