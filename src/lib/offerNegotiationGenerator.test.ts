import { describe, it, expect } from "vitest";
import { generateOfferNegotiationEmail } from "./offerNegotiationGenerator";

describe("offerNegotiationGenerator", () => {
  it("generiert eine Verhandlungs-E-Mail für mehr Fixgehalt mit Zielgehalt", () => {
    const result = generateOfferNegotiationEmail({
      candidateName: "Max Mustermann",
      recruiterName: "Frau Schmidt",
      companyName: "Acme Tech GmbH",
      position: "Frontend Developer",
      offeredSalary: 55000,
      targetSalary: 62000,
      scenario: "HIGHER_BASE_SALARY",
    });

    expect(result.subject).toContain("Frontend Developer");
    expect(result.body).toContain("Sehr geehrte/r Frau Schmidt");
    expect(result.body).toContain("62.000 €");
    expect(result.body).toContain("Fachinformatiker");
    expect(result.tacticalAdvice).toBeDefined();
  });

  it("generiert eine Verhandlungs-E-Mail für konkurrierende Angebote", () => {
    const result = generateOfferNegotiationEmail({
      candidateName: "Max Mustermann",
      companyName: "Web Solutions AG",
      position: "React Engineer",
      offeredSalary: 58000,
      targetSalary: 65000,
      competingSalary: 64000,
      scenario: "COMPETING_OFFER",
    });

    expect(result.body).toContain("konkretes Vertragsangebot");
    expect(result.body).toContain("64.000 €");
  });
});
