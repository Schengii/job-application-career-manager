import { describe, expect, it } from "vitest";
import type { ApplicationListItem } from "@/types";
import {
  COLUMN_OPTIONS,
  COLUMN_PRESETS,
  DEFAULT_COLUMNS,
  DEFAULT_FILTERS,
  EXCEL_PAGE_SIZE,
  areFiltersEqual,
  buildFilteredQueryUrl,
  buildStatusCountsQueryUrl,
  isTempRow,
  sortExcelRows,
  toExcelRow,
  type ExcelRow,
} from "./excelGrid";

function row(over: Partial<ExcelRow>): ExcelRow {
  return {
    id: "1",
    companyName: "Acme",
    position: "Dev",
    status: "SENT",
    applicationDate: "",
    portal: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    nextStep: "",
    nextStepDate: "",
    notes: "",
    ...over,
  };
}

describe("URL-Builder", () => {
  it("baut die Standard-URL ohne Filter", () => {
    expect(buildFilteredQueryUrl(1, DEFAULT_FILTERS)).toBe(
      `/api/applications?page=1&pageSize=${EXCEL_PAGE_SIZE}&sortBy=DATE_DESC`,
    );
  });

  it("nimmt aktive Filter auf und trimmt die Suche", () => {
    const url = buildFilteredQueryUrl(3, {
      status: "OFFER",
      portal: "Indeed",
      search: "  react ",
      onlyFollowUps: true,
      sortBy: "STATUS",
    });
    const params = new URL(url, "http://x").searchParams;
    expect(params.get("page")).toBe("3");
    expect(params.get("status")).toBe("OFFER");
    expect(params.get("portal")).toBe("Indeed");
    expect(params.get("search")).toBe("react");
    expect(params.get("onlyFollowUps")).toBe("true");
    expect(params.get("sortBy")).toBe("STATUS");
  });

  it("lässt den Status bei den Facet-Counts bewusst weg", () => {
    const url = buildStatusCountsQueryUrl({ ...DEFAULT_FILTERS, status: "OFFER", portal: "Indeed" });
    expect(url).toBe("/api/applications/status-counts?portal=Indeed");
    expect(buildStatusCountsQueryUrl(DEFAULT_FILTERS)).toBe("/api/applications/status-counts?");
  });
});

describe("areFiltersEqual", () => {
  it("erkennt Gleichheit und jede einzelne Abweichung", () => {
    expect(areFiltersEqual(DEFAULT_FILTERS, { ...DEFAULT_FILTERS })).toBe(true);
    expect(areFiltersEqual(DEFAULT_FILTERS, { ...DEFAULT_FILTERS, status: "SENT" })).toBe(false);
    expect(areFiltersEqual(DEFAULT_FILTERS, { ...DEFAULT_FILTERS, portal: "X" })).toBe(false);
    expect(areFiltersEqual(DEFAULT_FILTERS, { ...DEFAULT_FILTERS, search: "x" })).toBe(false);
    expect(areFiltersEqual(DEFAULT_FILTERS, { ...DEFAULT_FILTERS, onlyFollowUps: true })).toBe(false);
    expect(areFiltersEqual(DEFAULT_FILTERS, { ...DEFAULT_FILTERS, sortBy: "STATUS" })).toBe(false);
  });
});

describe("toExcelRow / isTempRow", () => {
  it("wandelt eine Bewerbung um (Datumsformat, Portal-Fallback, Leerwerte)", () => {
    const app = {
      id: "a1",
      status: "SENT",
      position: "Frontend",
      applicationDate: new Date("2026-01-15T10:00:00Z"),
      source: null,
      company: { name: "Acme", contactName: null, contactEmail: "x@y.de", contactPhone: null },
      jobPosting: { portalSource: "Indeed" },
      nextStep: null,
      nextStepDate: new Date("2026-02-01T00:00:00Z"),
      notes: null,
    } as unknown as ApplicationListItem;
    expect(toExcelRow(app)).toEqual({
      id: "a1",
      companyName: "Acme",
      position: "Frontend",
      status: "SENT",
      applicationDate: "2026-01-15",
      portal: "Indeed",
      contactName: "",
      contactEmail: "x@y.de",
      contactPhone: "",
      nextStep: "",
      nextStepDate: "2026-02-01",
      notes: "",
      isDirty: false,
    });
  });

  it("erkennt temporäre Zeilen an der ID", () => {
    expect(isTempRow({ id: "temp-123" })).toBe(true);
    expect(isTempRow({ id: "abc" })).toBe(false);
  });
});

describe("sortExcelRows", () => {
  const rows = [
    row({ id: "1", companyName: "Zeta", status: "SENT", applicationDate: "2026-01-10" }),
    row({ id: "2", companyName: "Alpha", status: "OFFER", applicationDate: "2026-03-01" }),
    row({ id: "3", companyName: "Mitte", status: "DRAFT", applicationDate: "" }),
  ];
  const ids = (l: ExcelRow[]) => l.map((r) => r.id);

  it("sortiert nach Datum, Firma und Status", () => {
    expect(ids(sortExcelRows(rows, "DATE_DESC"))).toEqual(["2", "1", "3"]);
    expect(ids(sortExcelRows(rows, "DATE_ASC"))).toEqual(["3", "1", "2"]);
    expect(ids(sortExcelRows(rows, "COMPANY_ASC"))).toEqual(["2", "3", "1"]);
    expect(ids(sortExcelRows(rows, "STATUS"))).toEqual(["3", "2", "1"]);
  });

  it("verändert die Eingabe nicht", () => {
    const copy = [...rows];
    sortExcelRows(rows, "COMPANY_ASC");
    expect(rows).toEqual(copy);
  });
});

describe("Spalten", () => {
  it("Presets decken alle Spalten ab und ALL entspricht dem Default", () => {
    const keys = Object.keys(DEFAULT_COLUMNS).sort();
    for (const preset of Object.values(COLUMN_PRESETS)) {
      expect(Object.keys(preset).sort()).toEqual(keys);
    }
    expect(COLUMN_PRESETS.ALL).toEqual(DEFAULT_COLUMNS);
    expect(COLUMN_PRESETS.COMPACT.notes).toBe(false);
    expect(COLUMN_PRESETS.CONTACTS.contact).toBe(true);
  });

  it("COLUMN_OPTIONS enthält jede Spalte genau einmal", () => {
    expect(COLUMN_OPTIONS.map((c) => c.key).sort()).toEqual(Object.keys(DEFAULT_COLUMNS).sort());
  });
});
