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
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST(postRequest({ url: "http://127.0.0.1:22/" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect((body.warnings as string[]).join(" ")).toMatch(/nicht erlaubt/i);
  });

  it("ruft fetch() niemals für den Cloud-Metadaten-Endpunkt (169.254.169.254) auf", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST(postRequest({ url: "http://169.254.169.254/latest/meta-data/" }));
    const body = await res.json();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect((body.warnings as string[]).join(" ")).toMatch(/nicht erlaubt/i);
  });

  it("ruft fetch() niemals für eine private 192.168.x.x-Adresse auf", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await POST(postRequest({ url: "http://192.168.1.1/admin" }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("lehnt strukturell ungültige URLs mit 400 ab, bevor überhaupt gefetcht wird", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST(postRequest({ url: "not-a-url" }));
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetcht weiterhin normal für eine öffentliche URL (kein Over-Blocking)", async () => {
    // IP-Literal statt Hostname, damit der Test deterministisch ohne echte
    // DNS-Auflösung läuft (net.isIP-Pfad in assertPublicHttpUrl) — die
    // öffentliche IP selbst ist bereits in ssrfGuard.test.ts als "nicht
    // privat" verifiziert.
    const fetchSpy = vi.fn(async () => new Response("<html><head></head><body></body></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST(postRequest({ url: "https://93.184.216.34/karriere/react-developer" }));
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
