import { describe, expect, it } from "vitest";
import { parseEmailResponse } from "./emailResponseParser";

describe("parseEmailResponse", () => {
  it("erkennt eine Einladung zum Vorstellungsgespräch inkl. Datum", () => {
    const email = `
      Sehr geehrter Herr Mustermann,
      vielen Dank für Ihre Bewerbung. Gerne möchten wir Sie zu einem persönlichen
      Kennenlerngespräch am 28.08.2026 um 14:00 Uhr via Microsoft Teams einladen.
      Mit freundlichen Grüßen,
      HR Team
    `;

    const res = parseEmailResponse(email);
    expect(res.detectedStatus).toBe("INTERVIEW");
    expect(res.extractedDate).toBe("28.08.2026");
    expect(res.extractedTime).toBe("14:00 Uhr");
  });

  it("erkennt eine Absage", () => {
    const email = `
      Sehr geehrter Bewerber,
      wir müssen Ihnen leider mitteilen, dass wir uns für einen anderen Kandidaten entschieden haben.
      Wir wünschen Ihnen viel Erfolg für Ihren weiteren Weg.
    `;

    const res = parseEmailResponse(email);
    expect(res.detectedStatus).toBe("REJECTED");
  });

  it("erkennt ein Vertragsangebot", () => {
    const email = `
      Hallo Herr Mustermann,
      wir freuen uns sehr, Ihnen ein Vertragsangebot als Frontend-Entwickler zu unterbreiten!
      Herzlich willkommen im Team.
    `;

    const res = parseEmailResponse(email);
    expect(res.detectedStatus).toBe("OFFER");
  });
});
