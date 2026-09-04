import { describe, it, expect } from "vitest";
import { calculateDin5008Metrics } from "./din5008Guard";

describe("din5008Guard", () => {
  it("erkennt optimalen Füllstand bei typischem DIN 5008 Anschreiben", () => {
    const text = `Sehr geehrte Damen und Herren,

mit großem Interesse habe ich Ihre Ausschreibung für die Position als Frontend Entwickler gelesen.

Als Fachinformatiker für Anwendungsentwicklung mit Schwerpunkt auf React, TypeScript und Next.js bringe ich fundierte praktische Erfahrung in der Konzeption modularer Webanwendungen mit. In meinem Referenzprojekt electroCheck-ai habe ich interaktive Prüfprotokolle umgesetzt und die Ladezeiten signifikant optimiert.

Über die Einladung zu einem persönlichen Gespräch freue ich mich sehr.

Mit freundlichen Grüßen
Max Mustermann`;

    const metrics = calculateDin5008Metrics(text);
    expect(metrics.status).toBe("OPTIMAL");
    expect(metrics.fillPercentage).toBeGreaterThanOrEqual(50);
    expect(metrics.fillPercentage).toBeLessThanOrEqual(85);
    expect(metrics.characterCount).toBeGreaterThan(300);
  });

  it("erkennt Überlänge (OVERFLOW) wenn der Text zu viele Zeilen umfasst", () => {
    // Generiere einen sehr langen Text mit vielen Absätzen
    const paragraphs = Array.from({ length: 20 }, (_, i) =>
      `Dies ist ein ausführlicher Absatz Nummer ${i + 1}, der detailliert beschreibt, wie verschiedene Webtechnologien eingesetzt werden, um hochperformante und skalierbare Architekturen im Enterprise-Umfeld umzusetzen.`
    );
    const longText = paragraphs.join("\n\n");

    const metrics = calculateDin5008Metrics(longText);
    expect(metrics.status).toBe("OVERFLOW");
    expect(metrics.fillPercentage).toBeGreaterThan(100);
    expect(metrics.statusLabel).toContain("Überlänge");
  });
});
