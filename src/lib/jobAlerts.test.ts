import { describe, expect, it } from "vitest";
import { evaluateJobAlerts, type JobAlertCriteria } from "./jobAlerts";

describe("jobAlerts Engine", () => {
  const mockJobs = [
    {
      id: "1",
      title: "Frontend Developer React",
      location: "Bonn",
      remote: false,
      salaryInfo: "48.000 €",
      matchScore: 88,
      techStack: "TypeScript,React,Tailwind",
      portalSource: "Stepstone",
      company: { name: "Telekom IT" },
    },
    {
      id: "2",
      title: "Java Backend Developer",
      location: "Dortmund",
      remote: false,
      salaryInfo: "45.000 €",
      matchScore: 40,
      techStack: "Java,Spring,SQL",
      portalSource: "Indeed",
      company: { name: "Materna" },
    },
    {
      id: "3",
      title: "React & Next.js Developer",
      location: "Köln (Remote)",
      remote: true,
      salaryInfo: "52.000 €",
      matchScore: 92,
      techStack: "TypeScript,React,Next.js",
      portalSource: "GetInIT",
      company: { name: "REWE digital" },
    },
  ];

  it("filtert Stellen anhand von Mindest-Score und Keywords", () => {
    const criteria: JobAlertCriteria = {
      minScore: 75,
      locationFilter: "ALL",
      minSalary: 40000,
      keywords: ["react"],
    };

    const digest = evaluateJobAlerts(mockJobs, criteria);
    expect(digest.totalMatches).toBe(2);
    expect(digest.topMatches[0].title).toContain("Next.js");
    expect(digest.topMatches[0].matchScore).toBe(92);
    expect(digest.digestSubject).toContain("Top-Matches");
  });

  it("filtert gezielt nach Remote-Arbeitsmodell", () => {
    const criteria: JobAlertCriteria = {
      minScore: 50,
      locationFilter: "REMOTE",
      minSalary: 40000,
      keywords: [],
    };

    const digest = evaluateJobAlerts(mockJobs, criteria);
    expect(digest.totalMatches).toBe(1);
    expect(digest.topMatches[0].companyName).toBe("REWE digital");
  });
});
