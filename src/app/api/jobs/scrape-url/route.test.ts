// -----------------------------------------------------------------------------
// Integrationstest: POST /api/jobs/scrape-url — end-to-end SSRF-Schutz
// -----------------------------------------------------------------------------
// src/lib/ssrfGuard.test.ts deckt die Guard-Logik selbst ab (isPrivateOrReservedIp,
// assertPublicHttpUrl). Dieser Test verifiziert zusätzlich end-to-end über die
// tatsächliche Route: Für eine private/interne Ziel-URL darf `fetch()` NIEMALS
// aufgerufen werden — unabhängig davon, wie die Route den Fehlerfall danach
// nach außen abbildet (aktuell: `success:true` mit Warnhinweis, siehe
// scrapeJobPostingUrl()'s Catch-Fallback in urlJobScraper.ts).
// -----------------------------------------------------------------------------
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { resetDb } from "@/test/dbTestUtils";

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/jobs/scrape-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/jobs/scrape-url (SSRF-Schutz end-to-end)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ruft fetch() niemals für eine Loopback-Adresse auf", async () => {
    const originalFetch = globalThis.fetch;
    const targetFetches: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (!url.includes("neon.tech")) {
        targetFetches.push(url);
      }
      return originalFetch(input, init);
    }));

    const res = await POST(postRequest({ url: "http://127.0.0.1:22/" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(targetFetches).toHaveLength(0);
    expect((body.warnings as string[]).join(" ")).toMatch(/nicht erlaubt/i);
  });

  it("ruft fetch() niemals für den Cloud-Metadaten-Endpunkt (169.254.169.254) auf", async () => {
    const originalFetch = globalThis.fetch;
    const targetFetches: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (!url.includes("neon.tech")) {
        targetFetches.push(url);
      }
      return originalFetch(input, init);
    }));

    const res = await POST(postRequest({ url: "http://169.254.169.254/latest/meta-data/" }));
    const body = await res.json();

    expect(targetFetches).toHaveLength(0);
    expect((body.warnings as string[]).join(" ")).toMatch(/nicht erlaubt/i);
  });

  it("ruft fetch() niemals für eine private 192.168.x.x-Adresse auf", async () => {
    const originalFetch = globalThis.fetch;
    const targetFetches: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (!url.includes("neon.tech")) {
        targetFetches.push(url);
      }
      return originalFetch(input, init);
    }));

    await POST(postRequest({ url: "http://192.168.1.1/admin" }));
    expect(targetFetches).toHaveLength(0);
  });

  it("lehnt strukturell ungültige URLs mit 400 ab, bevor überhaupt gefetcht wird", async () => {
    const originalFetch = globalThis.fetch;
    const targetFetches: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (!url.includes("neon.tech")) {
        targetFetches.push(url);
      }
      return originalFetch(input, init);
    }));

    const res = await POST(postRequest({ url: "not-a-url" }));
    expect(res.status).toBe(400);
    expect(targetFetches).toHaveLength(0);
  });

  it("fetcht weiterhin normal für eine öffentliche URL (kein Over-Blocking)", async () => {
    // IP-Literal statt Hostname, damit der Test deterministisch ohne echte
    // DNS-Auflösung läuft (net.isIP-Pfad in assertPublicHttpUrl) — die
    // öffentliche IP selbst ist bereits in ssrfGuard.test.ts als "nicht
    // privat" verifiziert.
    const originalFetch = globalThis.fetch;
    const targetFetches: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url.includes("neon.tech")) {
        return originalFetch(input, init);
      }
      targetFetches.push(url);
      return new Response("<html><head></head><body></body></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }));

    const res = await POST(postRequest({ url: "https://93.184.216.34/karriere/react-developer" }));
    expect(res.status).toBe(200);
    expect(targetFetches).toHaveLength(1);
  });
});
