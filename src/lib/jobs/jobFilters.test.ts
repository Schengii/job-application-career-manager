import { describe, expect, it } from "vitest";
import type { JobPostingWithCompany } from "@/types";
import {
  DEFAULT_JOB_FILTERS,
  countBelowThreshold,
  filterAndSortJobs,
  hasActiveJobFilters,
  type JobFilterContext,
  type JobFilters,
} from "./jobFilters";

function job(over: Record<string, unknown>): JobPostingWithCompany {
  return {
    id: "x",
    title: "Frontend Developer",
    description: "React und TypeScript",
    techStack: null,
    location: null,
    remote: false,
    matchScore: 0,
    portalSource: "INDEED",
    postedAt: "2026-01-01",
    company: { name: "Acme" },
    ...over,
  } as unknown as JobPostingWithCompany;
}

const jobs = [
  job({ id: "1", title: "React Dev", matchScore: 90, remote: true, company: { name: "Zeta" }, postedAt: "2026-02-01", techStack: "react,ts" }),
  job({ id: "2", title: "Backend Dev", matchScore: 60, portalSource: "STEPSTONE", company: { name: "Alpha" }, postedAt: "2026-03-01", location: "Köln" }),
  job({ id: "3", title: "Praktikum", matchScore: 20, company: null, postedAt: "2026-01-15", description: "Kaffee kochen" }),
  job({ id: "4", title: "Ohne Score", matchScore: null, company: { name: "Mitte" } }),
];

const ctx = (over: Partial<JobFilterContext> = {}): JobFilterContext => ({
  viewMode: "ACTIVE",
  minMatchScore: 0,
  respectThreshold: true,
  ...over,
});
const f = (over: Partial<JobFilters>): JobFilters => ({ ...DEFAULT_JOB_FILTERS, ...over });
const ids = (l: JobPostingWithCompany[]) => l.map((j) => j.id);

describe("filterAndSortJobs", () => {
  it("liefert [] ohne Daten und verändert die Eingabe nicht", () => {
    expect(filterAndSortJobs(undefined, DEFAULT_JOB_FILTERS, ctx())).toEqual([]);
    const copy = [...jobs];
    filterAndSortJobs(jobs, f({ sortBy: "COMPANY_ASC" }), ctx());
    expect(jobs).toEqual(copy);
  });

  it("sortiert nach Score (null = 0), Datum und Firma (ohne Firma zuerst)", () => {
    expect(ids(filterAndSortJobs(jobs, f({}), ctx())).slice(0, 2)).toEqual(["1", "2"]);
    expect(ids(filterAndSortJobs(jobs, f({ sortBy: "DATE_DESC" }), ctx()))[0]).toBe("2");
    expect(ids(filterAndSortJobs(jobs, f({ sortBy: "COMPANY_ASC" }), ctx()))).toEqual(["3", "2", "4", "1"]);
  });

  it("filtert nach Portal, Match-Stufe und Arbeitsmodell", () => {
    expect(ids(filterAndSortJobs(jobs, f({ portal: "STEPSTONE" }), ctx()))).toEqual(["2"]);
    expect(ids(filterAndSortJobs(jobs, f({ match: "TOP" }), ctx()))).toEqual(["1"]);
    expect(ids(filterAndSortJobs(jobs, f({ match: "GOOD" }), ctx()))).toEqual(["1", "2"]);
    expect(ids(filterAndSortJobs(jobs, f({ remote: "REMOTE" }), ctx()))).toEqual(["1"]);
    expect(ids(filterAndSortJobs(jobs, f({ remote: "ONSITE" }), ctx())).sort()).toEqual(["2", "3", "4"]);
  });

  it("sucht case-insensitiv in Titel, Firma, Tech-Stack, Ort und Beschreibung", () => {
    expect(ids(filterAndSortJobs(jobs, f({ search: "REACT" }), ctx()))).toContain("1");
    expect(ids(filterAndSortJobs(jobs, f({ search: "alpha" }), ctx()))).toEqual(["2"]);
    expect(ids(filterAndSortJobs(jobs, f({ search: "köln" }), ctx()))).toEqual(["2"]);
    expect(ids(filterAndSortJobs(jobs, f({ search: "kaffee" }), ctx()))).toEqual(["3"]);
    expect(filterAndSortJobs(jobs, f({ search: "   " }), ctx())).toHaveLength(4);
  });

  it("wendet den Mindest-Score nur in der aktiven Ansicht und bei aktivem Schalter an", () => {
    expect(ids(filterAndSortJobs(jobs, f({}), ctx({ minMatchScore: 50 })))).toEqual(["1", "2"]);
    expect(filterAndSortJobs(jobs, f({}), ctx({ minMatchScore: 50, respectThreshold: false }))).toHaveLength(4);
    expect(filterAndSortJobs(jobs, f({}), ctx({ minMatchScore: 50, viewMode: "DISMISSED" }))).toHaveLength(4);
  });
});

describe("countBelowThreshold / hasActiveJobFilters", () => {
  it("zählt Angebote unter dem Mindest-Score (null = 0)", () => {
    expect(countBelowThreshold(jobs, 50)).toBe(2);
    expect(countBelowThreshold(jobs, 0)).toBe(0);
    expect(countBelowThreshold(undefined, 50)).toBe(0);
  });

  it("zählt die Sortierung nicht als aktiven Filter", () => {
    expect(hasActiveJobFilters(DEFAULT_JOB_FILTERS)).toBe(false);
    expect(hasActiveJobFilters(f({ sortBy: "DATE_DESC" }))).toBe(false);
    expect(hasActiveJobFilters(f({ search: " x " }))).toBe(true);
    expect(hasActiveJobFilters(f({ remote: "REMOTE" }))).toBe(true);
  });
});
