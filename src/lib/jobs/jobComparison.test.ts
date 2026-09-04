import { describe, expect, it } from "vitest";
import { compareJobs, type JobComparisonItem } from "@/lib/jobs/jobComparison";

describe("jobComparison Engine", () => {
  const jobA: JobComparisonItem = {
    id: "job-1",
    title: "Frontend Developer (m/w/d) React",
    companyName: "Telekom IT",
    location: "Bonn (100% Remote)",
    remote: true,
    salaryInfo: "48.000 € – 56.000 € / Jahr",
    matchScore: 85,
    techStack: "TypeScript,React,Next.js,Tailwind CSS,Vitest",
    description: "Moderne Webentwicklung mit React und TypeScript.",
    portalSource: "Stepstone",
  };

  const jobB: JobComparisonItem = {
    id: "job-2",
    title: "Webentwickler (m/w/d)",
    companyName: "Ruhrpixel GmbH",
    location: "Essen",
    remote: false,
    salaryInfo: "42.000 € – 48.000 € / Jahr",
    matchScore: 70,
    techStack: "JavaScript,React,Vue,CSS,Git",
    description: "Entwicklung von Kundenportalen.",
    portalSource: "GetInIT",
  };

  it("vergleicht zwei Stellenangebote auf Tech-Stack Overlap, Gehalt und Score", () => {
    const result = compareJobs(jobA, jobB);

    expect(result.commonTech).toContain("react");
    expect(result.uniqueTechA).toContain("typescript");
    expect(result.uniqueTechA).toContain("next.js");
    expect(result.uniqueTechB).toContain("vue");

    expect(result.scoreDiff.winner).toBe("A");
    expect(result.scoreDiff.diffPercent).toBe(15);
    expect(result.salaryDiff.winner).toBe("A");
    expect(result.recommendation).toContain("Telekom IT");
  });
});
