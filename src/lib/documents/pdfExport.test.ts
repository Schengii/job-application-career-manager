import { describe, it, expect } from "vitest";
import { wrapHtmlForPdfExport } from "@/lib/documents/pdfExport";

describe("pdfExport", () => {
  it("hüllt HTML-Inhalt in ein druckfertiges DIN A4 Dokument ein", () => {
    const wrapped = wrapHtmlForPdfExport({
      title: "Lebenslauf Max Mustermann",
      htmlContent: "<div class='cv'><h1>Lebenslauf</h1></div>",
      documentType: "CV",
    });

    expect(wrapped).toContain("<!DOCTYPE html>");
    expect(wrapped).toContain("Lebenslauf Max Mustermann");
    expect(wrapped).toContain("size: A4 portrait");
    expect(wrapped).toContain("<div class='cv'><h1>Lebenslauf</h1></div>");
  });
});
