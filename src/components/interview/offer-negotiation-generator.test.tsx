// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OfferNegotiationGenerator } from "./offer-negotiation-generator";

describe("OfferNegotiationGenerator", () => {
  it("rendert Szenarien und generiert E-Mail-Vorschau", () => {
    render(
      <OfferNegotiationGenerator
        defaultCompany="Supercode GmbH"
        defaultPosition="React Specialist"
        defaultOfferedSalary={52000}
        defaultTargetSalary={60000}
      />
    );

    expect(screen.getByText(/Generierte Verhandlungs-E-Mail/i)).toBeDefined();
    expect(screen.getByText(/Taktischer Verhandlungstipp/i)).toBeDefined();

    const perksBtn = screen.getByText(/Remote-Tage & Weiterbildungsbudget/i);
    fireEvent.click(perksBtn);

    expect(screen.getByText(/Zusatzleistungen wie Weiterbildungsbudgets/i)).toBeDefined();
  });
});
