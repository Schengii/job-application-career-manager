import { describe, it, expect } from "vitest";
import { generateEmlString } from "./emlExport";

describe("emlExport", () => {
  it("erzeugt standardkonforme MIME RFC 822 E-Mail Struktur", () => {
    const eml = generateEmlString({
      to: "recruiting@techfirma.de",
      from: "max@example.com",
      subject: "Bewerbung als Frontend Entwickler",
      body: "Sehr geehrte Damen und Herren,\n\nanbei meine Unterlagen.",
      date: new Date("2026-08-15T12:00:00Z"),
    });

    expect(eml).toContain("MIME-Version: 1.0");
    expect(eml).toContain("To: recruiting@techfirma.de");
    expect(eml).toContain("From: max@example.com");
    expect(eml).toContain("X-Unsent: 1");
    expect(eml).toContain("Sehr geehrte Damen und Herren,");
    expect(eml).toContain("anbei meine Unterlagen.");
  });
});
