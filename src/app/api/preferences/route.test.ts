// -----------------------------------------------------------------------------
// Integrationstest: /api/preferences (GET/PATCH)
// -----------------------------------------------------------------------------
// Deckt insbesondere die Sicherheitslogik rund um `aiApiKey` ab: der Key darf
// niemals im Klartext an den Client zurückgegeben werden, wird at-rest
// verschlüsselt in der DB gespeichert (siehe src/lib/secretCrypto.ts), ein
// PATCH ohne das Feld darf einen zuvor gespeicherten Key nicht überschreiben,
// und ein leerer String muss den Key gezielt entfernen können (siehe
// src/lib/preferences.ts).
// -----------------------------------------------------------------------------
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "./route";
import { resetDb } from "@/test/dbTestUtils";
import { prisma } from "@/lib/core/prisma";
import { decryptSecret } from "@/lib/core/secretCrypto";

function patchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/preferences", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("GET legt beim ersten Aufruf automatisch einen Default-Datensatz an", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.id).toBe("default");
    expect(body.aiApiKey).toBeNull();
    expect(body.hasAiApiKey).toBe(false);
  });

  it("PATCH mit aiApiKey speichert den Key verschlüsselt, gibt ihn aber nie im Klartext zurück", async () => {
    const response = await PATCH(patchRequest({ aiApiKey: "sk-super-secret-12345" }));
    const body = await response.json();

    expect(body.aiApiKey).toBeNull();
    expect(body.hasAiApiKey).toBe(true);
    expect(body.aiApiKeyPreview).toBe("••••••••2345");

    // Der reale Key landet weiterhin (nur serverseitig, z. B. für /api/ai) in
    // der DB — aber verschlüsselt, nicht im Klartext (siehe secretCrypto.ts).
    const stored = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(stored?.aiApiKey).not.toBe("sk-super-secret-12345");
    expect(stored?.aiApiKey).toMatch(/^enc:v1:/);
    expect(decryptSecret(stored!.aiApiKey!)).toBe("sk-super-secret-12345");
  });

  it("PATCH ohne aiApiKey-Feld lässt einen bereits gespeicherten Key unverändert", async () => {
    await PATCH(patchRequest({ aiApiKey: "sk-original-key" }));

    const response = await PATCH(patchRequest({ fullName: "Max Mustermann" }));
    const body = await response.json();

    expect(body.fullName).toBe("Max Mustermann");
    expect(body.hasAiApiKey).toBe(true);

    const stored = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(decryptSecret(stored!.aiApiKey!)).toBe("sk-original-key");
  });

  it("PATCH mit leerem aiApiKey entfernt den gespeicherten Key gezielt", async () => {
    await PATCH(patchRequest({ aiApiKey: "sk-to-be-removed" }));

    const response = await PATCH(patchRequest({ aiApiKey: "" }));
    const body = await response.json();

    expect(body.hasAiApiKey).toBe(false);
    expect(body.aiApiKeyPreview).toBeNull();

    const stored = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(stored?.aiApiKey).toBeNull();
  });

  // Dieselbe Sicherheitslogik gilt seit dem echten IMAP-Sync (src/lib/imapClient.ts)
  // auch für imapPassword — dupliziert die drei aiApiKey-Tests oben 1:1.
  it("PATCH mit imapPassword speichert das Passwort verschlüsselt, gibt es aber nie im Klartext zurück", async () => {
    const response = await PATCH(patchRequest({ imapPassword: "app-password-12345" }));
    const body = await response.json();

    expect(body.imapPassword).toBeNull();
    expect(body.hasImapPassword).toBe(true);
    expect(body.imapPasswordPreview).toBe("••••••••2345");

    const stored = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(stored?.imapPassword).not.toBe("app-password-12345");
    expect(stored?.imapPassword).toMatch(/^enc:v1:/);
    expect(decryptSecret(stored!.imapPassword!)).toBe("app-password-12345");
  });

  it("PATCH ohne imapPassword-Feld lässt ein bereits gespeichertes Passwort unverändert", async () => {
    await PATCH(patchRequest({ imapPassword: "original-app-password" }));

    const response = await PATCH(patchRequest({ imapHost: "imap.gmail.com" }));
    const body = await response.json();

    expect(body.imapHost).toBe("imap.gmail.com");
    expect(body.hasImapPassword).toBe(true);

    const stored = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(decryptSecret(stored!.imapPassword!)).toBe("original-app-password");
  });

  it("PATCH mit leerem imapPassword entfernt das gespeicherte Passwort gezielt", async () => {
    await PATCH(patchRequest({ imapPassword: "to-be-removed" }));

    const response = await PATCH(patchRequest({ imapPassword: "" }));
    const body = await response.json();

    expect(body.hasImapPassword).toBe(false);
    expect(body.imapPasswordPreview).toBeNull();

    const stored = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(stored?.imapPassword).toBeNull();
  });
});
