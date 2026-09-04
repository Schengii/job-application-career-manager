import { describe, it, expect } from "vitest";
import { analyzeDocumentContent } from "@/lib/documents/documentParser";

describe("documentParser", () => {
  it("erkennt ein IHK-Abschlusszeugnis und extrahiert Skills und Noten", () => {
    const res = analyzeDocumentContent(
      "IHK_Abschlusszeugnis_Fachinformatiker_AE.pdf",
      "Prüfungszeugnis der Industrie- und Handelskammer. Gesamtnote: 1,4. Kenntnisse in React, TypeScript und REST API nachgewiesen."
    );

    expect(res.suggestedCategory).toBe("ZEUGNIS_UMSCHULUNG");
    expect(res.isIhkCertificate).toBe(true);
    expect(res.detectedSkills).toContain("React");
    expect(res.detectedSkills).toContain("TypeScript");
    expect(res.detectedSkills).toContain("REST API");
    expect(res.detectedInstitution).toContain("IHK");
  });

  it("erkennt ein Arbeitszeugnis korrekt als REFERENZ", () => {
    const res = analyzeDocumentContent(
      "Zwischenzeugnis_Frontend_Developer.pdf",
      "Herr Mustermann hat stets zu unserer vollsten Zufriedenheit gearbeitet. Sehr gut."
    );

    expect(res.suggestedCategory).toBe("REFERENZ");
    expect(res.detectedGrade).toBe("Sehr gut");
  });
});
