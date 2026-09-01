// -----------------------------------------------------------------------------
// Integrationstest: /api/email-sync (GET/POST)
// -----------------------------------------------------------------------------
// Deckt insbesondere ab, dass der echte IMAP-Abruf (src/lib/imapClient.ts)
// korrekt eingebunden ist: ohne gespeicherte Zugangsdaten bleibt das bisherige
// Sample-Verhalten unverändert (Regressionsschutz), `simulate: true` erzwingt
// die Sample-Inbox auch bei vorhandener Konfiguration, und das im Request
// mitgegebene Test-Passwort hat Vorrang vor dem gespeicherten.
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";
import { GET, POST, PUT } from "./route";

// vi.mock()-Aufrufe werden von Vitest an den Anfang der Datei gehoisted,
// greifen also bereits für den obigen Import von "./route".
const mockFetchInboxMessages = vi.fn();
vi.mock("@/lib/imapClient", () => ({
  fetchInboxMessages: (...args: unknown[]) => mockFetchInboxMessages(...args),
}));

// sendDueNotifications() wird in PUT fire-and-forget aufgerufen — gemockt,
// damit kein echter (nicht awaited) DB-Zugriff mit resetDb() im nächsten
// Test kollidieren kann (siehe status/route.test.ts für dieselbe Begründung).
const mockSendDueNotifications = vi.fn().mockResolvedValue({ sent: 0, skipped: 0 });
vi.mock("@/lib/pushNotifications", () => ({
  sendDueNotifications: () => mockSendDueNotifications(),
}));

function postRequest(body: unknown = {}) {
  return new NextRequest("http://localhost/api/email-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function putRequest(body: unknown) {
  return new NextRequest("http://localhost/api/email-sync", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/email-sync", () => {
  beforeEach(async () => {
    await resetDb();
    mockFetchInboxMessages.mockReset();
    mockFetchInboxMessages.mockResolvedValue({ messages: [], usedRealImap: false });
    mockSendDueNotifications.mockClear();
  });

  it("GET liefert hasImapPassword/imapPasswordPreview, niemals das Passwort selbst", async () => {
    await prisma.preferences.create({
      data: { id: "default", imapHost: "imap.gmail.com", imapPassword: "app-password-12345" },
    });

    const response = await GET();
    const body = await response.json();

    expect(body.imapHost).toBe("imap.gmail.com");
    expect(body.imapPassword).toBeUndefined();
    expect(body.hasImapPassword).toBe(true);
    expect(body.imapPasswordPreview).toBe("••••••••2345");
  });

  it("POST ohne gespeicherte Konfiguration ruft fetchInboxMessages auf und liefert dessen Ergebnis (Sample-Fallback)", async () => {
    const response = await POST(postRequest({}));
    const body = await response.json();

    expect(mockFetchInboxMessages).toHaveBeenCalledOnce();
    expect(body.success).toBe(true);
    expect(body.usedRealImap).toBe(false);
  });

  it("POST mit simulate:true erzwingt die Sample-Inbox, OHNE fetchInboxMessages aufzurufen", async () => {
    await prisma.preferences.create({
      data: { id: "default", imapEnabled: true, imapHost: "imap.gmail.com", imapUser: "a@b.de", imapPassword: "pw" },
    });

    const response = await POST(postRequest({ simulate: true }));
    const body = await response.json();

    expect(mockFetchInboxMessages).not.toHaveBeenCalled();
    expect(body.usedRealImap).toBe(false);
  });

  it("POST reicht ein im Request mitgegebenes Test-Passwort mit Vorrang vor dem gespeicherten an fetchInboxMessages weiter", async () => {
    await prisma.preferences.create({
      data: { id: "default", imapEnabled: true, imapHost: "imap.gmail.com", imapUser: "a@b.de", imapPassword: "gespeichert" },
    });

    await POST(postRequest({ password: "einmaliges-test-passwort" }));

    expect(mockFetchInboxMessages).toHaveBeenCalledWith(
      expect.objectContaining({ imapPassword: "einmaliges-test-passwort" }),
      expect.anything()
    );
  });

  it("POST meldet usedRealImap:true zurück, wenn fetchInboxMessages eine echte Verbindung meldet", async () => {
    mockFetchInboxMessages.mockResolvedValueOnce({ messages: [], usedRealImap: true });

    const response = await POST(postRequest({}));
    const body = await response.json();

    expect(body.usedRealImap).toBe(true);
  });

  it("PUT aktualisiert den Bewerbungsstatus und löst sendDueNotifications() aus (Web-Push)", async () => {
    const company = await prisma.company.create({ data: { name: "Acme GmbH" } });
    const app = await prisma.application.create({ data: { position: "X", status: "SENT", companyId: company.id } });

    const response = await PUT(
      putRequest({ applicationId: app.id, newStatus: "INTERVIEW", note: "Einladung erkannt" })
    );
    const body = await response.json();

    expect(body.application.status).toBe("INTERVIEW");
    expect(mockSendDueNotifications).toHaveBeenCalledOnce();
  });

  it("POST persistiert erkannte Status-Vorschläge als EmailSuggestion (für die Antworten-Inbox)", async () => {
    const company = await prisma.company.create({ data: { name: "adesso SE" } });
    const app = await prisma.application.create({
      data: { position: "Frontend Entwickler", status: "SENT", companyId: company.id },
    });

    mockFetchInboxMessages.mockResolvedValueOnce({
      messages: [
        {
          id: "msg-1",
          from: "recruiting@adessose.de",
          subject: `Einladung zum Vorstellungsgespräch: ${app.position}`,
          date: new Date().toISOString(),
          snippet: "Wir laden Sie ein ...",
          fullBody: `Sehr geehrter Bewerber, wir möchten Sie zum Vorstellungsgespräch bei ${company.name} einladen.`,
        },
      ],
      usedRealImap: false,
    });

    await POST(postRequest({}));

    const suggestions = await prisma.emailSuggestion.findMany({ where: { applicationId: app.id } });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      emailId: "msg-1",
      suggestedStatus: "INTERVIEW",
      status: "PENDING",
    });
  });

  it("POST legt bei erneutem Sync derselben E-Mail keinen doppelten Vorschlag an", async () => {
    const company = await prisma.company.create({ data: { name: "adesso SE" } });
    const app = await prisma.application.create({
      data: { position: "Frontend Entwickler", status: "SENT", companyId: company.id },
    });

    const sampleMessage = {
      id: "msg-1",
      from: "recruiting@adessose.de",
      subject: `Einladung zum Vorstellungsgespräch: ${app.position}`,
      date: new Date().toISOString(),
      snippet: "Wir laden Sie ein ...",
      fullBody: `Sehr geehrter Bewerber, wir möchten Sie zum Vorstellungsgespräch bei ${company.name} einladen.`,
    };
    mockFetchInboxMessages.mockResolvedValue({ messages: [sampleMessage], usedRealImap: false });

    await POST(postRequest({}));
    await POST(postRequest({}));

    const suggestions = await prisma.emailSuggestion.findMany({ where: { applicationId: app.id } });
    expect(suggestions).toHaveLength(1);
  });
});
