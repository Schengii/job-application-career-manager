// -----------------------------------------------------------------------------
// Integrationstest: POST /api/ai — end-to-end Entschlüsselung des KI-API-Keys
// -----------------------------------------------------------------------------
// src/lib/secretCrypto.test.ts deckt die Ver-/Entschlüsselung isoliert ab.
// Dieser Test verifiziert zusätzlich end-to-end: Ein in der DB verschlüsselt
// gespeicherter aiApiKey (so, wie ihn PATCH /api/preferences seit
// src/lib/secretCrypto.ts tatsächlich ablegt) muss beim Aufruf von /api/ai
// korrekt entschlüsselt und im Klartext an den LLM-Provider übergeben werden
// — nicht der Chiffretext.
// -----------------------------------------------------------------------------
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { resetDb } from "@/test/dbTestUtils";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secretCrypto";

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai (End-to-End-Entschlüsselung des gespeicherten API-Keys)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("entschlüsselt den in der DB verschlüsselt gespeicherten aiApiKey und sendet den Klartext an den Provider", async () => {
    const plainKey = "sk-plaintext-test-key-1234";
    await prisma.preferences.create({
      data: {
        id: "default",
        aiProvider: "openai",
        aiApiKey: encryptSecret(plainKey),
      },
    });

    let capturedAuthHeader: string | null = null;
    const fetchSpy = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      capturedAuthHeader = headers.Authorization;
      return new Response(
        JSON.stringify({ choices: [{ message: { content: "Poliertes Anschreiben." } }] }),
        { status: 200 }
      );
    });
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST(
      postRequest({
        action: "POLISH_COVER_LETTER",
        coverLetter: "Sehr geehrte Damen und Herren...",
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.usedAi).toBe(true);

    // Die entscheidende Prüfung: Der an den Provider gesendete Key ist der
    // KLARTEXT, nicht der in der DB gespeicherte Chiffretext.
    expect(capturedAuthHeader).toBe(`Bearer ${plainKey}`);

    const stored = await prisma.preferences.findUnique({ where: { id: "default" } });
    expect(stored?.aiApiKey).not.toBe(plainKey);
    expect(stored?.aiApiKey).toMatch(/^enc:v1:/);
  });

  it("fällt ohne gespeicherten Key auf die Offline-Heuristik zurück, ohne zu fetchen", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST(
      postRequest({
        action: "POLISH_COVER_LETTER",
        coverLetter: "Sehr geehrte Damen und Herren, hiermit bewerbe ich mich mit großem Interesse auf Ihre ausgeschriebene Stelle.",
      })
    );

    const body = await res.json();
    expect(body.usedAi).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
