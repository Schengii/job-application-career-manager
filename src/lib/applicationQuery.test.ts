import { describe, expect, it } from "vitest";
import { buildApplicationOrderBy, buildApplicationWhere, parseApplicationQueryParams } from "./applicationQuery";

describe("buildApplicationWhere", () => {
  it("liefert ein leeres where-Objekt ohne Filter", () => {
    expect(buildApplicationWhere({})).toEqual({});
  });

  it("filtert nach Status", () => {
    expect(buildApplicationWhere({ status: "SENT" })).toEqual({ status: "SENT" });
  });

  it("filtert nach Portal über source ODER jobPosting.portalSource", () => {
    expect(buildApplicationWhere({ portal: "LinkedIn" })).toEqual({
      AND: [{ OR: [{ source: "LinkedIn" }, { jobPosting: { portalSource: "LinkedIn" } }] }],
    });
  });

  it("filtert nach Tag via contains", () => {
    expect(buildApplicationWhere({ tag: "Prio1" })).toEqual({
      AND: [{ tags: { contains: "Prio1" } }],
    });
  });

  it("filtert per Volltextsuche über Position/Firma/Tags/Notizen/nächsten Schritt", () => {
    expect(buildApplicationWhere({ search: "Acme" })).toEqual({
      AND: [
        {
          OR: [
            { position: { contains: "Acme" } },
            { company: { name: { contains: "Acme" } } },
            { tags: { contains: "Acme" } },
            { notes: { contains: "Acme" } },
            { nextStep: { contains: "Acme" } },
          ],
        },
      ],
    });
  });

  it("ignoriert eine nur aus Leerzeichen bestehende Suche", () => {
    expect(buildApplicationWhere({ search: "   " })).toEqual({});
  });

  it("filtert auf Bewerbungen mit gesetztem nextStep oder nextStepDate bei onlyFollowUps", () => {
    expect(buildApplicationWhere({ onlyFollowUps: true })).toEqual({
      AND: [{ OR: [{ nextStep: { not: null } }, { nextStepDate: { not: null } }] }],
    });
  });

  it("kombiniert mehrere Filter gleichzeitig", () => {
    const where = buildApplicationWhere({ status: "SENT", search: "Acme", onlyFollowUps: true });
    expect(where.status).toBe("SENT");
    expect(where.AND).toHaveLength(2);
  });
});

describe("buildApplicationOrderBy", () => {
  it("sortiert standardmäßig nach Datum absteigend", () => {
    expect(buildApplicationOrderBy(undefined)).toEqual([{ applicationDate: "desc" }]);
    expect(buildApplicationOrderBy(null)).toEqual([{ applicationDate: "desc" }]);
  });

  it("unterstützt alle vier Sortieroptionen", () => {
    expect(buildApplicationOrderBy("DATE_ASC")).toEqual([{ applicationDate: "asc" }]);
    expect(buildApplicationOrderBy("COMPANY_ASC")).toEqual([{ company: { name: "asc" } }]);
    expect(buildApplicationOrderBy("STATUS")).toEqual([{ status: "asc" }]);
  });
});

describe("parseApplicationQueryParams", () => {
  it("liest alle Filter-Parameter aus den Query-Params", () => {
    const params = new URLSearchParams(
      "status=SENT&portal=LinkedIn&tag=Prio1&search=Acme&onlyFollowUps=true&sortBy=STATUS"
    );
    expect(parseApplicationQueryParams(params)).toEqual({
      status: "SENT",
      portal: "LinkedIn",
      tag: "Prio1",
      search: "Acme",
      onlyFollowUps: true,
      sortBy: "STATUS",
    });
  });

  it("liefert null/false-Defaults, wenn keine Parameter gesetzt sind", () => {
    expect(parseApplicationQueryParams(new URLSearchParams())).toEqual({
      status: null,
      portal: null,
      tag: null,
      search: null,
      onlyFollowUps: false,
      sortBy: null,
    });
  });
});
