import { describe, it, expect, vi } from "vitest";
import { runJobCrawlerTick } from "./crawlerScheduler";
import { prisma } from "@/lib/core/prisma";
import * as realJobSearch from "@/lib/jobs/realJobSearch";

vi.mock("@/lib/core/prisma", () => ({
  prisma: {
    preferences: {
      findUnique: vi.fn(),
    },
    jobPosting: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    company: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    pushSubscription: {
      findMany: vi.fn(),
    },
  },
}));

describe("crawlerScheduler", () => {
  it("bricht ab und liefert 0, wenn keine Preferences existieren", async () => {
    vi.mocked(prisma.preferences.findUnique).mockResolvedValue(null);

    const res = await runJobCrawlerTick();
    expect(res.crawledCount).toBe(0);
    expect(res.newJobsStored).toBe(0);
  });

  it("crawlt Stellen und speichert neue Angebote ab", async () => {
    vi.mocked(prisma.preferences.findUnique).mockResolvedValue({
      id: "default",
      desiredRole: "React Entwickler",
      techStack: "React, TypeScript, CSS",
      preferredLocations: "Bonn, Remote",
      remotePreference: "HYBRID",
    } as any);

    vi.spyOn(realJobSearch, "searchLiveJobs").mockResolvedValue({
      jobs: [
        {
          id: "job-123",
          title: "Senior React Developer",
          companyName: "Acme Tech",
          location: "Bonn",
          portalSource: "ARBEITNOW",
          techStack: ["React", "TypeScript"],
          description: "Tolles Team...",
          remote: true,
          postedAt: new Date(),
          salaryInfo: "60.000 €",
          sourceUrl: "https://example.com/job-123",
        },
      ],
      totalFound: 1,
      sourcesQueried: ["ARBEITNOW"],
      isFallback: false,
    });

    vi.mocked(prisma.jobPosting.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.company.findFirst).mockResolvedValue({ id: "comp-1", name: "Acme Tech" } as any);
    vi.mocked(prisma.jobPosting.create).mockResolvedValue({ id: "jp-1" } as any);
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([]);

    const res = await runJobCrawlerTick();
    expect(res.crawledCount).toBe(1);
    expect(res.newJobsStored).toBe(1);
  });
});
