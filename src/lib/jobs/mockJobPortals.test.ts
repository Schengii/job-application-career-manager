import { describe, expect, it } from "vitest";
import {
  generateSimulatedJobPostings,
  generateMultiPortalBatch,
  SUPPORTED_PORTALS,
} from "@/lib/jobs/mockJobPortals";

describe("mockJobPortals Engine", () => {
  it("erzeugt eine konfigurierbare Anzahl an Stellenangeboten", () => {
    const jobs = generateSimulatedJobPostings(10);
    expect(jobs.length).toBe(10);

    for (const job of jobs) {
      expect(job.title).toBeDefined();
      expect(job.companyName).toBeDefined();
      expect(job.techStack).toBeDefined();
      expect(job.techStack.length).toBeGreaterThan(0);
      expect(job.sourceUrl).toContain("https://");
      expect(job.salaryInfo).toContain("€");
    }
  });

  it("erzeugt gezielte Stellenangebote für ein bestimmtes Portal", () => {
    const stepstoneJobs = generateSimulatedJobPostings(5, "Stepstone");
    for (const job of stepstoneJobs) {
      expect(job.portalSource).toBe("Stepstone");
      expect(job.sourceUrl).toContain("stepstone.de");
    }
  });

  it("erzeugt einen Multi-Portal-Batch über alle unterstützten Jobportale", () => {
    const multiBatch = generateMultiPortalBatch(2);
    expect(multiBatch.length).toBe(SUPPORTED_PORTALS.length * 2);

    const portals = new Set(multiBatch.map((j) => j.portalSource));
    expect(portals.size).toBe(SUPPORTED_PORTALS.length);
  });
});
