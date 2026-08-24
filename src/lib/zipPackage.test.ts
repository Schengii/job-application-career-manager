import { describe, expect, it } from "vitest";
import { createApplicationZipPackage } from "./zipPackage";
import JSZip from "jszip";

describe("createApplicationZipPackage", () => {
  it("erstellt ein valides ZIP-Archiv mit Anschreiben und Übersicht", async () => {
    const zipBuffer = await createApplicationZipPackage({
      position: "Frontend Entwickler",
      companyName: "Tech Corp GmbH",
      coverLetterContent: "Sehr geehrte Damen und Herren,\n\nhier ist mein Anschreiben.",
      applicationDate: new Date("2026-08-10"),
      notes: "Bewerbung über GetInIT",
      documents: [
        {
          name: "Lebenslauf 2026",
          category: "LEBENSLAUF",
          fileName: "lebenslauf.pdf",
        },
      ],
    });

    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(100);

    // ZIP Inhalt mit JSZip validieren
    const loadedZip = await JSZip.loadAsync(zipBuffer);
    const files = Object.keys(loadedZip.files);

    expect(files.some((f) => f.includes("Anschreiben.txt"))).toBe(true);
    expect(files.some((f) => f.includes("Anschreiben.html"))).toBe(true);
    expect(files.some((f) => f.includes("Uebersicht.txt"))).toBe(true);
  });
});
