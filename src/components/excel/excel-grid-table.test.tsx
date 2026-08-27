// @vitest-environment jsdom
// -----------------------------------------------------------------------------
// Regressionstests für zwei über /code-review gefundene Bugs in der
// Excel-Tabellenansicht:
//   1. Suche/Filter durchsuchten bisher nur die aktuell geladene(n) Seite(n)
//      statt serverseitig ALLE Bewerbungen (siehe reloadFirstPage()).
//   2. `hasMoreRows` wurde durch unsaved neue Zeilen (temp-...) verfälscht,
//      weil `rows.length` statt der tatsächlich vom Server geladenen
//      Zeilenzahl verglichen wurde (siehe persistedRowCount).
// -----------------------------------------------------------------------------
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { ExcelGridTable } from "./excel-grid-table";
import { fetcher } from "@/lib/api";
import type { ApplicationListItem } from "@/types";
import type { PaginatedResult } from "@/lib/apiUtils";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
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
    mockedFetcher.mockResolvedValueOnce(page([makeApp({ id: "1", companyName: "Alpha GmbH" })], 2));
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
    mockedFetcher.mockResolvedValueOnce(page([makeApp({ id: "1", companyName: "Alpha GmbH", status: "SENT" })], 2));
    renderGrid();
    await screen.findByDisplayValue("Alpha GmbH");

    // Eine Bewerbung, die NIE lokal geladen wurde (liegt "auf Seite 2") -> darf
    // nur über einen echten Server-Request sichtbar werden, nicht durch reines
    // Filtern der bereits geladenen 1 Zeile.
    mockedFetcher.mockResolvedValueOnce(page([makeApp({ id: "2", companyName: "Beta AG", status: "INTERVIEW" })], 1));

    fireEvent.change(screen.getByRole("combobox", { name: /nach status filtern/i }), {
      target: { value: "INTERVIEW" },
    });

    await waitFor(() => expect(screen.getByDisplayValue("Beta AG")).toBeInTheDocument());
    expect(screen.queryByDisplayValue("Alpha GmbH")).not.toBeInTheDocument();

    const lastCallUrl = mockedFetcher.mock.calls.at(-1)?.[0] as string;
    expect(lastCallUrl).toContain("status=INTERVIEW");
  });

  it("löst die Volltextsuche erst debounced auf dem Server aus, nicht auf den bereits geladenen Zeilen", async () => {
    mockedFetcher.mockResolvedValueOnce(page([makeApp({ id: "1", companyName: "Alpha GmbH" })], 2));
    renderGrid();
    await screen.findByDisplayValue("Alpha GmbH");

    mockedFetcher.mockResolvedValueOnce(page([makeApp({ id: "2", companyName: "Gamma OHG" })], 1));

    fireEvent.change(screen.getByPlaceholderText(/in tabelle suchen/i), { target: { value: "Gamma" } });

    // Vor Ablauf der Debounce-Verzögerung darf noch kein zweiter Request raus sein.
    expect(mockedFetcher).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(screen.getByDisplayValue("Gamma OHG")).toBeInTheDocument(), { timeout: 2000 });
    const lastCallUrl = mockedFetcher.mock.calls.at(-1)?.[0] as string;
    expect(lastCallUrl).toContain("search=Gamma");
  });

  it("verwirft einen Filterwechsel bei ungespeicherten Änderungen, wenn die Sicherheitsabfrage abgelehnt wird", async () => {
    mockedFetcher.mockResolvedValueOnce(page([makeApp({ id: "1", companyName: "Alpha GmbH" })], 1));
    renderGrid();
    await screen.findByDisplayValue("Alpha GmbH");

    // Zelle bearbeiten -> Zeile wird "dirty".
    fireEvent.change(screen.getByDisplayValue("Alpha GmbH"), { target: { value: "Alpha GmbH (bearbeitet)" } });

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.change(screen.getByRole("combobox", { name: /nach status filtern/i }), {
      target: { value: "INTERVIEW" },
    });

    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    // Kein zweiter fetcher-Aufruf, da die Sicherheitsabfrage abgelehnt wurde.
    expect(mockedFetcher).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue("Alpha GmbH (bearbeitet)")).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
