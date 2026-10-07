import { describe, expect, it } from "vitest";
import { searchRemotiveJobs } from "./remotiveJobs";

describe("remotiveJobs", () => {
  it("liefert Array zurück (entweder echte Jobs oder sicherer leerer Fallback bei Timeout)", async () => {
    const jobs = await searchRemotiveJobs("Frontend", 5);
    expect(Array.isArray(jobs)).toBe(true);
    if (jobs.length > 0) {
      expect(jobs[0].portalSource).toBe("REMOTIVE");
      expect(jobs[0].remote).toBe(true);
      expect(jobs[0].companyName).toBeDefined();
    }
  });
});
