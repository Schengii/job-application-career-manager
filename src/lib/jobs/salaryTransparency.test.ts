import { describe, expect, it } from "vitest";
import { checkSalaryTransparency } from "./salaryTransparency";

describe("salaryTransparency", () => {
  it("erkennt explizites salaryInfo-Feld als transparent", () => {
    const res = checkSalaryTransparency("52.000 € – 60.000 €", "");
    expect(res.hasTransparentSalary).toBe(true);
    expect(res.badgeLabel).toContain("Gehalt angegeben");
    expect(res.badgeColor).toContain("emerald");
  });

  it("erkennt Gehaltsangaben im Fließtext der Beschreibung", () => {
    const res = checkSalaryTransparency(null, "Wir bieten ein Jahresgehalt von 55.000 € sowie 30 Tage Urlaub.");
    expect(res.hasTransparentSalary).toBe(true);
  });

  it("liefert Warnung und Benchmark-Korridor, wenn Gehalt fehlt", () => {
    const res = checkSalaryTransparency(null, "Wir suchen einen React-Entwickler mit Freude am Coden.");
    expect(res.hasTransparentSalary).toBe(false);
    expect(res.badgeLabel).toContain("Kein Gehaltsband");
    expect(res.benchmarkRangeText).toContain("NRW / Remote Richtwert");
  });
});
