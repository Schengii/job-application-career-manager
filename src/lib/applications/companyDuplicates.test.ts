import { describe, expect, it } from "vitest";
import { findCompanyDuplicates, normalizeCompanyName } from "@/lib/applications/companyDuplicates";

describe("normalizeCompanyName", () => {
  it("ignoriert Groß-/Kleinschreibung", () => {
    expect(normalizeCompanyName("Acme")).toBe(normalizeCompanyName("ACME"));
  });

  it("entfernt gängige Rechtsform-Suffixe", () => {
    expect(normalizeCompanyName("Acme GmbH")).toBe(normalizeCompanyName("Acme AG"));
    expect(normalizeCompanyName("Muster KG")).toBe(normalizeCompanyName("Muster"));
  });

  it("vereinheitlicht Umlaute/Diakritika", () => {
    expect(normalizeCompanyName("Müller")).toBe(normalizeCompanyName("Muller"));
  });

  it("ignoriert Satzzeichen und mehrfache Leerzeichen", () => {
    expect(normalizeCompanyName("Acme & Co.")).toBe(normalizeCompanyName("Acme   Co"));
  });
});

describe("findCompanyDuplicates", () => {
  const existing = [
    { id: "1", name: "Acme GmbH" },
    { id: "2", name: "Beispiel AG" },
  ];

  it("findet eine bestehende Firma mit gleichem normalisierten Namen", () => {
    const result = findCompanyDuplicates("acme", existing);
    expect(result).toEqual([{ id: "1", name: "Acme GmbH" }]);
  });

  it("liefert leeres Array, wenn kein Name übereinstimmt", () => {
    expect(findCompanyDuplicates("Voellig Neu", existing)).toEqual([]);
  });

  it("liefert leeres Array bei leerem/nur-Rechtsform-Namen statt Fehltreffer", () => {
    expect(findCompanyDuplicates("GmbH", existing)).toEqual([]);
    expect(findCompanyDuplicates("", existing)).toEqual([]);
  });
});
