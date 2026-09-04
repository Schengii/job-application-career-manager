import { describe, it, expect } from "vitest";
import { detectPortalSourceFromUrl, scrapeJobPostingUrl } from "@/lib/jobs/urlJobScraper";

describe("urlJobScraper", () => {
  it("erkennt Portalquellen anhand von Domainnamen", () => {
    expect(detectPortalSourceFromUrl("https://www.stepstone.de/stellenangebote/123")).toBe("STEPSTONE");
    expect(detectPortalSourceFromUrl("https://de.indeed.com/viewjob?jk=abc")).toBe("INDEED");
    expect(detectPortalSourceFromUrl("https://www.get-in-it.de/job/456")).toBe("GETINIT");
    expect(detectPortalSourceFromUrl("https://arbeitsagentur.de/jobsuche")).toBe("ARBEITSAGENTUR");
    expect(detectPortalSourceFromUrl("https://firmenwebsite.de/karriere/job")).toBe("OTHER");
  });

  it("erzeugt ein strukturiertes Fallback-Objekt für ungültige oder Offline-URLs", async () => {
    const result = await scrapeJobPostingUrl("https://example.com/karriere/react-developer");

    expect(result.success).toBe(true);
    expect(result.job).toHaveProperty("title");
    expect(result.job).toHaveProperty("techStack");
    expect(result.job.companyName).toBeDefined();
  });
});
