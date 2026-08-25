import { describe, it, expect } from "vitest";
import { extractTechKeywordsFromText, searchRealJobs } from "./realJobSearch";

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
