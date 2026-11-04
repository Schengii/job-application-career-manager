import { describe, expect, it } from "vitest";
import type { ApplicationListItem } from "@/types";
import {
  DEFAULT_APPLICATION_FILTERS,
  collectTags,
  filterAndSortApplications,
  hasActiveFilters,
} from "./applicationFilters";

function app(over: Record<string, unknown>): ApplicationListItem {
  return {
    id: "x",
    position: "Frontend Dev",
    status: "SENT",
    tags: null,
    notes: null,
    nextStep: null,
    nextStepDate: null,
    source: null,
    applicationDate: null,
    jobPosting: null,
    company: { name: "Acme" },
    ...over,
  } as unknown as ApplicationListItem;
}

const list = [
  app({ id: "1", company: { name: "Zeta" }, status: "SENT", tags: "react,remote", applicationDate: "2026-01-10", source: "StepStone" }),
  app({ id: "2", company: { name: "Alpha" }, status: "OFFER", tags: "react19", applicationDate: "2026-03-01", nextStep: "Call", jobPosting: { portalSource: "Indeed" } }),
  app({ id: "3", company: { name: "Mitte" }, status: "SENT", position: "Backend", notes: "Wunschfirma", applicationDate: null }),
];
const ids = (l: ApplicationListItem[]) => l.map((a) => a.id);
const f = (over: Partial<typeof DEFAULT_APPLICATION_FILTERS>) => ({ ...DEFAULT_APPLICATION_FILTERS, ...over });

describe("filterAndSortApplications", () => {
  it("liefert [] ohne Daten und verändert die Eingabe nicht", () => {
    expect(filterAndSortApplications(undefined, DEFAULT_APPLICATION_FILTERS)).toEqual([]);
    const copy = [...list];
    filterAndSortApplications(list, f({ sortBy: "COMPANY_ASC" }));
    expect(list).toEqual(copy);
  });

  it("sortiert Datum absteigend (ohne Datum zuletzt), aufsteigend, Firma, Status", () => {
    expect(ids(filterAndSortApplications(list, f({})))).toEqual(["2", "1", "3"]);
    expect(ids(filterAndSortApplications(list, f({ sortBy: "DATE_ASC" })))).toEqual(["3", "1", "2"]);
    expect(ids(filterAndSortApplications(list, f({ sortBy: "COMPANY_ASC" })))).toEqual(["2", "3", "1"]);
    expect(filterAndSortApplications(list, f({ sortBy: "STATUS" }))[0].status).toBe("OFFER");
  });

  it("filtert nach Status", () => {
    expect(ids(filterAndSortApplications(list, f({ status: "OFFER" })))).toEqual(["2"]);
  });

  it("filtert Portal über source mit Fallback auf jobPosting.portalSource", () => {
    expect(ids(filterAndSortApplications(list, f({ portal: "StepStone" })))).toEqual(["1"]);
    expect(ids(filterAndSortApplications(list, f({ portal: "Indeed" })))).toEqual(["2"]);
  });

  it("filtert Tags exakt (react trifft nicht react19)", () => {
    expect(ids(filterAndSortApplications(list, f({ tag: "react" })))).toEqual(["1"]);
  });

  it("sucht case-insensitiv in Firma, Position, Notizen, Tags, nächster Schritt", () => {
    expect(ids(filterAndSortApplications(list, f({ search: "WUNSCH" })))).toEqual(["3"]);
    expect(ids(filterAndSortApplications(list, f({ search: "backend" })))).toEqual(["3"]);
    expect(ids(filterAndSortApplications(list, f({ search: "call" })))).toEqual(["2"]);
    expect(ids(filterAndSortApplications(list, f({ search: "  " }))).length).toBe(3);
  });

  it("onlyFollowUps behält Einträge mit nextStep oder nextStepDate", () => {
    expect(ids(filterAndSortApplications(list, f({ onlyFollowUps: true })))).toEqual(["2"]);
  });
});

describe("collectTags / hasActiveFilters", () => {
  it("sammelt eindeutige, sortierte Tags", () => {
    expect(collectTags(list)).toEqual(["react", "react19", "remote"]);
    expect(collectTags(undefined)).toEqual([]);
  });

  it("zählt die Sortierung nicht als aktiven Filter", () => {
    expect(hasActiveFilters(DEFAULT_APPLICATION_FILTERS)).toBe(false);
    expect(hasActiveFilters(f({ sortBy: "STATUS" }))).toBe(false);
    expect(hasActiveFilters(f({ search: " x " }))).toBe(true);
    expect(hasActiveFilters(f({ onlyFollowUps: true }))).toBe(true);
  });
});
