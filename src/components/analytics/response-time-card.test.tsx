// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResponseTimeCard } from "./response-time-card";
import { computeResponseTimeStats, type ResponseTimeInput } from "@/lib/analytics/responseTime";

const BASE = new Date("2026-01-01T00:00:00Z");

function app(days: number, source: string | null = null): ResponseTimeInput {
  return {
    applicationDate: BASE,
    source,
    statusEvents: [{ status: "REJECTED", changedAt: new Date(BASE.getTime() + days * 86_400_000) }],
  };
}

describe("ResponseTimeCard", () => {
  it("zeigt einen Hinweistext ohne Daten", () => {
    render(<ResponseTimeCard stats={computeResponseTimeStats([])} />);
    expect(screen.getByText(/Noch keine Rückmeldungen/)).toBeInTheDocument();
  });

  it("zeigt auch ohne übergebene Statistik den Leerzustand", () => {
    render(<ResponseTimeCard />);
    expect(screen.getByText("Antwortzeit-Analyse")).toBeInTheDocument();
  });

  it("zeigt Kennzahlen, Verteilung, Quelle mit Portal-Label und Nachfass-Hinweis", () => {
    const stats = computeResponseTimeStats([
      app(2, "INDEED"),
      app(4, "INDEED"),
      app(6),
      app(8),
      app(30),
    ]);
    render(<ResponseTimeCard stats={stats} />);

    expect(screen.getByText("Durchschnitt")).toBeInTheDocument();
    expect(screen.getByText("10 Tage")).toBeInTheDocument(); // Ø (2+4+6+8+30)/5 = 10
    expect(screen.getByText("Median")).toBeInTheDocument();
    expect(screen.getByText("0–3 Tage")).toBeInTheDocument();
    expect(screen.getByText(/9 von 10 Antworten kamen innerhalb von 30 Tagen/)).toBeInTheDocument();
    expect(screen.getByText("Indeed")).toBeInTheDocument();
    expect(screen.getByText("Ø 3 d")).toBeInTheDocument();
  });

  it("stellt die Diagramme für Screenreader mit Beschriftung bereit", () => {
    const stats = computeResponseTimeStats([app(2, "INDEED"), app(4, "INDEED")]);
    render(<ResponseTimeCard stats={stats} />);
    expect(screen.getByText("Anzahl Rückmeldungen je Zeitfenster")).toBeInTheDocument();
    expect(screen.getByText("Durchschnittliche Antwortzeit in Tagen je Quelle")).toBeInTheDocument();
  });
});
