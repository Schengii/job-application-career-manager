import { describe, it, expect, beforeEach, vi } from "vitest";
import { extractTechKeywordsFromText, searchRealJobs, clearSearchCache } from "@/lib/jobs/realJobSearch";

describe("realJobSearch", () => {
  it("extrahiert Web-Tech-Keywords präzise aus Anzeigentexten", () => {
    const text = "Wir suchen einen Entwickler für moderne React, TypeScript und Next.js Webanwendungen mit Tailwind CSS und REST.";
    const keywords = extractTechKeywordsFromText(text);

    expect(keywords).toContain("React");
    expect(keywords).toContain("TypeScript");
    expect(keywords).toContain("Next.js");
    expect(keywords).toContain("Tailwind");
    expect(keywords).toContain("REST");
  });

  it("liefert valide Stellenangebote im Fallback-Modus bei Offline-Suche", async () => {
    const result = await searchRealJobs({
      query: "Fachinformatiker Anwendungsentwicklung",
      location: "Bonn",
      radius: 50,
      source: "ALL",
      limit: 5,
    });

    expect(result.jobs.length).toBeGreaterThan(0);
    expect(result.jobs[0]).toHaveProperty("title");
    expect(result.jobs[0]).toHaveProperty("companyName");
    expect(result.jobs[0]).toHaveProperty("techStack");
  });
});

describe("searchRealJobs Response-Cache", () => {
  beforeEach(() => {
    clearSearchCache();
    vi.unstubAllGlobals();
  });

  function mockEmptyExternalApis() {
    // Beide externen APIs liefern absichtlich leer -> `searchRealJobs`
    // fällt auf `generateLiveFallbackJobs()` zurück, ohne dass ein echtes
    // Netzwerk-Mock-Format für die jeweilige API nachgebaut werden muss.
    const fetchMock = vi.fn(async () => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("ruft die externen APIs bei identischen Suchanfragen innerhalb der TTL nur einmal auf", async () => {
    const fetchMock = mockEmptyExternalApis();
    const params = { query: "Frontend", location: "Bonn", radius: 25, source: "ALL" as const, limit: 10 };

    await searchRealJobs(params);
    const callsAfterFirst = fetchMock.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    await searchRealJobs({ ...params }); // neues Objekt, gleicher Inhalt

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it("ruft die externen APIs bei unterschiedlichen Suchparametern erneut auf (kein Cache-Treffer)", async () => {
    const fetchMock = mockEmptyExternalApis();

    await searchRealJobs({ query: "Frontend", location: "Bonn", radius: 25, source: "ALL", limit: 10 });
    const callsAfterFirst = fetchMock.mock.calls.length;

    await searchRealJobs({ query: "Backend", location: "Bonn", radius: 25, source: "ALL", limit: 10 });

    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("ruft die externen APIs nach clearSearchCache() erneut auf", async () => {
    const fetchMock = mockEmptyExternalApis();
    const params = { query: "Frontend", location: "Bonn", radius: 25, source: "ALL" as const, limit: 10 };

    await searchRealJobs(params);
    const callsAfterFirst = fetchMock.mock.calls.length;

    clearSearchCache();
    await searchRealJobs(params);

    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });
});
