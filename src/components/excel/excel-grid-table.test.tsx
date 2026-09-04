// @vitest-environment jsdom
// -----------------------------------------------------------------------------
// Regressionstests für drei über /code-review bzw. Nachfolge-Optimierung
// gefundene Bugs in der Excel-Tabellenansicht:
//   1. Suche/Filter durchsuchten bisher nur die aktuell geladene(n) Seite(n)
//      statt serverseitig ALLE Bewerbungen (siehe reloadFirstPage()).
//   2. `hasMoreRows` wurde durch unsaved neue Zeilen (temp-...) verfälscht,
//      weil `rows.length` statt der tatsächlich vom Server geladenen
//      Zeilenzahl verglichen wurde (siehe persistedRowCount).
//
// Jede Zeile lädt nebenbei IMMER auch die Status-Facet-Counts (s.
// status-counts/route.ts) über denselben `fetcher` — die Test-Mocks unten
// unterscheiden daher explizit zwischen beiden Endpunkten, statt sich auf
// eine simple Aufruf-Reihenfolge/-Anzahl zu verlassen.
// -----------------------------------------------------------------------------
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { ExcelGridTable } from "./excel-grid-table";
import { fetcher } from "@/lib/core/api";
import type { ApplicationListItem } from "@/types";
import type { PaginatedResult } from "@/lib/core/apiUtils";

vi.mock("@/lib/core/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/core/api")>("@/lib/core/api");
  return {
    ...actual,
    fetcher: vi.fn(),
    apiPost: vi.fn(),
    apiDelete: vi.fn(),
  };
});

const mockedFetcher = vi.mocked(fetcher);

function makeApp(overrides: { id: string; companyName: string; status?: string }): ApplicationListItem {
  return {
    id: overrides.id,
    status: overrides.status ?? "SENT",
    position: "Frontend Entwickler",
    applicationDate: new Date("2026-01-15"),
    source: "OTHER",
    company: { name: overrides.companyName, contactName: null, contactEmail: null, contactPhone: null },
    jobPosting: null,
    nextStep: null,
    nextStepDate: null,
    notes: null,
  } as unknown as ApplicationListItem;
}

function page(data: ApplicationListItem[], total: number): PaginatedResult<ApplicationListItem> {
  return { data, total, page: 1, pageSize: 50, totalPages: Math.max(1, Math.ceil(total / 50)) };
}

/**
 * Richtet den gemockten `fetcher` ein: Aufrufe an `/api/applications/status-
 * counts` werden immer mit einer leeren, harmlosen Antwort bedient (die
 * Zähler sind nicht Gegenstand dieser Tests); Aufrufe an `/api/applications`
 * selbst werden der Reihe nach aus `responses` bedient. Gibt ein Array
 * zurück, das jede tatsächlich abgerufene `/api/applications`-URL enthält
 * (in Aufrufreihenfolge) — darüber prüfen die Tests unten Request-Anzahl und
 * -Parameter, ohne von der (nicht garantierten) Interleaving-Reihenfolge mit
 * den Status-Counts-Aufrufen abhängig zu sein.
 */
function mockApplicationsResponses(responses: PaginatedResult<ApplicationListItem>[]): string[] {
  const queue = [...responses];
  const calledUrls: string[] = [];
  mockedFetcher.mockImplementation(async (url: unknown) => {
    const urlString = String(url);
    if (urlString.startsWith("/api/applications/status-counts")) {
      return { total: 0, byStatus: {} };
    }
    calledUrls.push(urlString);
    const next = queue.shift();
    if (!next) throw new Error(`Unerwarteter zusätzlicher /api/applications-Aufruf: ${urlString}`);
    return next;
  });
  return calledUrls;
}

// Jeder Test bekommt einen frischen SWR-Cache-Provider — sonst würde der
// globale SWR-Cache Ergebnisse zwischen Tests unter demselben Query-Key
// (`/api/applications?page=1&pageSize=50`) wiederverwenden und die gezielt
// pro Test gemockten fetcher-Antworten verschieben.
function renderGrid() {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <ExcelGridTable />
    </SWRConfig>
  );
}

describe("ExcelGridTable", () => {
  beforeEach(() => {
    mockedFetcher.mockReset();
  });

  it("hält die 'Weitere laden'-Anzeige korrekt, nachdem eine ungespeicherte neue Zeile hinzugefügt wurde", async () => {
    // Nur 1 von insgesamt 2 Bewerbungen geladen -> "Weitere laden" muss sichtbar sein.
    mockApplicationsResponses([page([makeApp({ id: "1", companyName: "Alpha GmbH" })], 2)]);
    renderGrid();

    await screen.findByDisplayValue("Alpha GmbH");
    expect(screen.getByRole("button", { name: /weitere 1 laden/i })).toBeInTheDocument();

    // Eine neue (unsaved) Zeile hinzufügen -> rows.length wächst auf 2, obwohl
    // serverseitig weiterhin nur 1 von 2 echten Bewerbungen geladen ist.
    fireEvent.click(screen.getByRole("button", { name: /neue zeile/i }));

    // Vor dem Fix wäre der Button jetzt verschwunden (rows.length(2) < total(2) === false).
    expect(screen.getByRole("button", { name: /weitere 1 laden/i })).toBeInTheDocument();
  });

  it("filtert serverseitig über alle Bewerbungen, nicht nur die aktuell geladene Seite", async () => {
    const calledUrls = mockApplicationsResponses([
      page([makeApp({ id: "1", companyName: "Alpha GmbH", status: "SENT" })], 2),
      page([makeApp({ id: "2", companyName: "Beta AG", status: "INTERVIEW" })], 1),
    ]);
    renderGrid();
    await screen.findByDisplayValue("Alpha GmbH");

    // Eine Bewerbung, die NIE lokal geladen wurde (liegt "auf Seite 2") -> darf
    // nur über einen echten Server-Request sichtbar werden, nicht durch reines
    // Filtern der bereits geladenen 1 Zeile.
    fireEvent.change(screen.getByRole("combobox", { name: /nach status filtern/i }), {
      target: { value: "INTERVIEW" },
    });

    await waitFor(() => expect(screen.getByDisplayValue("Beta AG")).toBeInTheDocument());
    expect(screen.queryByDisplayValue("Alpha GmbH")).not.toBeInTheDocument();

    expect(calledUrls.at(-1)).toContain("status=INTERVIEW");
  });

  it("löst die Volltextsuche erst debounced auf dem Server aus, nicht auf den bereits geladenen Zeilen", async () => {
    const calledUrls = mockApplicationsResponses([
      page([makeApp({ id: "1", companyName: "Alpha GmbH" })], 2),
      page([makeApp({ id: "2", companyName: "Gamma OHG" })], 1),
    ]);
    renderGrid();
    await screen.findByDisplayValue("Alpha GmbH");

    fireEvent.change(screen.getByPlaceholderText(/in tabelle suchen/i), { target: { value: "Gamma" } });

    // Vor Ablauf der Debounce-Verzögerung darf noch kein zweiter /api/applications-Request raus sein.
    expect(calledUrls).toHaveLength(1);

    await waitFor(() => expect(screen.getByDisplayValue("Gamma OHG")).toBeInTheDocument(), { timeout: 2000 });
    expect(calledUrls.at(-1)).toContain("search=Gamma");
  });

  it("verwirft einen Filterwechsel bei ungespeicherten Änderungen, wenn die Sicherheitsabfrage abgelehnt wird", async () => {
    const calledUrls = mockApplicationsResponses([page([makeApp({ id: "1", companyName: "Alpha GmbH" })], 1)]);
    renderGrid();
    await screen.findByDisplayValue("Alpha GmbH");

    // Zelle bearbeiten -> Zeile wird "dirty".
    fireEvent.change(screen.getByDisplayValue("Alpha GmbH"), { target: { value: "Alpha GmbH (bearbeitet)" } });

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.change(screen.getByRole("combobox", { name: /nach status filtern/i }), {
      target: { value: "INTERVIEW" },
    });

    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    // Kein zweiter /api/applications-Aufruf, da die Sicherheitsabfrage abgelehnt wurde.
    expect(calledUrls).toHaveLength(1);
    expect(screen.getByDisplayValue("Alpha GmbH (bearbeitet)")).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("zeigt die Status-Facet-Counts aus dem Server (nicht nur die geladene Seite) in den Dropdown-Optionen an", async () => {
    mockedFetcher.mockImplementation(async (url: unknown) => {
      const urlString = String(url);
      if (urlString.startsWith("/api/applications/status-counts")) {
        return { total: 42, byStatus: { SENT: 30, INTERVIEW: 12 } };
      }
      return page([makeApp({ id: "1", companyName: "Alpha GmbH" })], 42);
    });
    renderGrid();
    await screen.findByDisplayValue("Alpha GmbH");

    const statusSelect = (await screen.findByRole("combobox", {
      name: /nach status filtern/i,
    })) as HTMLSelectElement;

    // "Alle Status (42)" trotz nur 1 lokal geladener Zeile -> Zahl kommt aus
    // dem Facet-Counts-Endpoint, nicht aus `rows.length`.
    await waitFor(() => expect(statusSelect.options[0].textContent).toBe("Alle Status (42)"));
    const interviewOption = Array.from(statusSelect.options).find((o) => o.value === "INTERVIEW")!;
    expect(interviewOption.textContent).toContain("(12)");
  });
});
