// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "./kanban-board";
import { APPLICATION_STATUSES } from "@/lib/core/constants";
import type { ApplicationListItem } from "@/types";

/**
 * Baut ein minimales `ApplicationListItem`-Fixture. Das Kanban-Board liest
 * nur eine Teilmenge der Felder (id, status, position, company.name,
 * applicationDate, source, jobPosting.portalSource) — der Cast über
 * `unknown` spart das Ausfüllen der übrigen, hier irrelevanten Prisma-Felder.
 */
function makeApp(overrides: {
  id: string;
  status: string;
  position: string;
  companyName: string;
  source?: string | null;
}): ApplicationListItem {
  return {
    id: overrides.id,
    status: overrides.status,
    position: overrides.position,
    applicationDate: new Date("2026-01-15"),
    source: overrides.source ?? null,
    company: { name: overrides.companyName },
    jobPosting: null,
  } as unknown as ApplicationListItem;
}

describe("KanbanBoard", () => {
  it("rendert für jeden Status eine Spalte mit deutschem Label", () => {
    render(<KanbanBoard applications={[]} onStatusChange={vi.fn()} />);
    for (const status of APPLICATION_STATUSES) {
      expect(screen.getByText(status.label)).toBeInTheDocument();
    }
  });

  it("gruppiert Bewerbungen in die Spalte ihres Status", () => {
    const apps = [
      makeApp({ id: "1", status: "SENT", position: "Frontend Entwickler", companyName: "Acme GmbH" }),
      makeApp({ id: "2", status: "INTERVIEW", position: "Fullstack Entwickler", companyName: "Beta AG" }),
    ];
    render(<KanbanBoard applications={apps} onStatusChange={vi.fn()} />);

    expect(screen.getByText("Acme GmbH")).toBeInTheDocument();
    expect(screen.getByText("Frontend Entwickler")).toBeInTheDocument();
    expect(screen.getByText("Beta AG")).toBeInTheDocument();
  });

  it("zeigt die korrekte Kartenanzahl pro Spalte an", () => {
    const apps = [
      makeApp({ id: "1", status: "SENT", position: "Rolle A", companyName: "A" }),
      makeApp({ id: "2", status: "SENT", position: "Rolle B", companyName: "B" }),
    ];
    render(<KanbanBoard applications={apps} onStatusChange={vi.fn()} />);

    const sentLabel = APPLICATION_STATUSES.find((s) => s.value === "SENT")!.label;
    const sentColumnHeader = screen.getByText(sentLabel).closest("div")!.parentElement!;
    const countBadge = sentColumnHeader.lastElementChild!;
    expect(countBadge).toHaveTextContent("2");
  });

  it("zeigt einen Platzhaltertext für leere Spalten", () => {
    render(<KanbanBoard applications={[]} onStatusChange={vi.fn()} />);
    // Die Spalte "Entwurf" zeigt statt des Platzhalters eine Ablage-Fläche für
    // Stellenanzeigen; alle anderen Spalten zeigen den Platzhaltertext.
    const emptyPlaceholders = screen.getAllByText("Keine Bewerbungen");
    expect(emptyPlaceholders).toHaveLength(APPLICATION_STATUSES.length - 1);
    expect(screen.getByText("Stellenanzeige ablegen")).toBeInTheDocument();
  });

  it("löst onStatusChange mit der Ziel-Spalte aus, wenn eine Karte dorthin gezogen und fallen gelassen wird", () => {
    const onStatusChange = vi.fn();
    const apps = [makeApp({ id: "1", status: "SENT", position: "Rolle A", companyName: "Acme GmbH" })];
    render(<KanbanBoard applications={apps} onStatusChange={onStatusChange} />);

    const card = screen.getByText("Acme GmbH").closest("a")!;
    const interviewLabel = APPLICATION_STATUSES.find((s) => s.value === "INTERVIEW")!.label;
    // Die Spalte ist der äußere Container, der Kopfzeile (mit dem Label) und
    // Kartenliste gemeinsam umschließt — genau das Element, auf dem
    // KanbanBoard die Drag&Drop-Handler registriert.
    const interviewColumn = screen.getByText(interviewLabel).closest("div")!.parentElement!.parentElement!;

    const dataTransfer = { effectAllowed: "" };
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(interviewColumn, { dataTransfer });
    fireEvent.drop(interviewColumn, { dataTransfer });

    expect(onStatusChange).toHaveBeenCalledExactlyOnceWith("1", "INTERVIEW");
  });

  it("löst onStatusChange NICHT aus, wenn ohne vorherigen Drag ein Drop-Event auf einer Spalte auftritt", () => {
    const onStatusChange = vi.fn();
    const apps = [makeApp({ id: "1", status: "SENT", position: "Rolle A", companyName: "Acme GmbH" })];
    render(<KanbanBoard applications={apps} onStatusChange={onStatusChange} />);

    const interviewLabel = APPLICATION_STATUSES.find((s) => s.value === "INTERVIEW")!.label;
    const interviewColumn = screen.getByText(interviewLabel).closest("div")!.parentElement!.parentElement!;

    fireEvent.drop(interviewColumn, { dataTransfer: {} });
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  describe("Tastatur-Bedienbarkeit (Status-Menü)", () => {
    it("öffnet per Klick auf den Menü-Button ein Menü mit allen Zielspalten außer der aktuellen", async () => {
      const user = userEvent.setup();
      const apps = [makeApp({ id: "1", status: "SENT", position: "Rolle A", companyName: "Acme GmbH" })];
      render(<KanbanBoard applications={apps} onStatusChange={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: "Status von Acme GmbH ändern" }));

      const menu = screen.getByRole("menu");
      const sentLabel = APPLICATION_STATUSES.find((s) => s.value === "SENT")!.label;
      expect(within(menu).queryByText(new RegExp(sentLabel))).not.toBeInTheDocument();
      for (const status of APPLICATION_STATUSES.filter((s) => s.value !== "SENT")) {
        expect(within(menu).getByRole("menuitem", { name: new RegExp(status.label) })).toBeInTheDocument();
      }
    });

    it("löst onStatusChange aus und schließt das Menü, wenn ein Menüpunkt gewählt wird", async () => {
      const onStatusChange = vi.fn();
      const user = userEvent.setup();
      const apps = [makeApp({ id: "1", status: "SENT", position: "Rolle A", companyName: "Acme GmbH" })];
      render(<KanbanBoard applications={apps} onStatusChange={onStatusChange} />);

      await user.click(screen.getByRole("button", { name: "Status von Acme GmbH ändern" }));
      const interviewLabel = APPLICATION_STATUSES.find((s) => s.value === "INTERVIEW")!.label;
      await user.click(screen.getByRole("menuitem", { name: new RegExp(interviewLabel) }));

      expect(onStatusChange).toHaveBeenCalledExactlyOnceWith("1", "INTERVIEW");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("kündigt einen erfolgten Statuswechsel in der aria-live-Region an", async () => {
      const user = userEvent.setup();
      const apps = [makeApp({ id: "1", status: "SENT", position: "Rolle A", companyName: "Acme GmbH" })];
      render(<KanbanBoard applications={apps} onStatusChange={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: "Status von Acme GmbH ändern" }));
      const interviewLabel = APPLICATION_STATUSES.find((s) => s.value === "INTERVIEW")!.label;
      await user.click(screen.getByRole("menuitem", { name: new RegExp(interviewLabel) }));

      expect(screen.getByRole("status")).toHaveTextContent(`Acme GmbH nach „${interviewLabel}“ verschoben.`);
    });

    it("schließt das Menü bei Klick außerhalb, ohne onStatusChange auszulösen", async () => {
      const onStatusChange = vi.fn();
      const user = userEvent.setup();
      const apps = [makeApp({ id: "1", status: "SENT", position: "Rolle A", companyName: "Acme GmbH" })];
      render(<KanbanBoard applications={apps} onStatusChange={onStatusChange} />);

      await user.click(screen.getByRole("button", { name: "Status von Acme GmbH ändern" }));
      expect(screen.getByRole("menu")).toBeInTheDocument();

      await user.click(document.body);

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(onStatusChange).not.toHaveBeenCalled();
    });
  });
});
