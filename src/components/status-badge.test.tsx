// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplicationStatusBadge, CompanyStatusBadge, CoverLetterStatusBadge } from "./status-badge";

describe("ApplicationStatusBadge", () => {
  it("zeigt das deutsche Label für einen bekannten Status", () => {
    render(<ApplicationStatusBadge status="INTERVIEW" />);
    expect(screen.getByText("Vorstellungsgespräch")).toBeInTheDocument();
  });

  it("fällt bei einem unbekannten Status auf den Rohwert zurück, statt leer zu bleiben", () => {
    render(<ApplicationStatusBadge status="UNBEKANNT_STATUS" />);
    expect(screen.getByText("UNBEKANNT_STATUS")).toBeInTheDocument();
  });
});

describe("CompanyStatusBadge", () => {
  it("zeigt das deutsche Label für einen bekannten Status", () => {
    render(<CompanyStatusBadge status="PARTNER" />);
    expect(screen.getByText("Partner")).toBeInTheDocument();
  });
});

describe("CoverLetterStatusBadge", () => {
  it("rendert ohne zu werfen und zeigt einen Text für den übergebenen Status", () => {
    render(<CoverLetterStatusBadge status="DRAFT" />);
    expect(screen.getByText(/./)).toBeInTheDocument();
  });
});
