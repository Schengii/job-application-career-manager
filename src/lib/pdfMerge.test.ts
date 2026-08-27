import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { createApplicationPdfPackage } from "./pdfMerge";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// 1x1-Pixel PNG (kleinstmögliches gültiges PNG) für die Bild-Einbettungs-Tests.
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

let testPdfPath: string;
let testPngPath: string;
let largePngPath: string;
let unsupportedPath: string;

beforeAll(async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Ein echtes, kleines Mehrseiten-PDF als Zeugnis-Fixture.
  const fixtureDoc = await PDFDocument.create();
  const font = await fixtureDoc.embedFont(StandardFonts.Helvetica);
  const page1 = fixtureDoc.addPage();
  page1.drawText("Zeugnis Seite 1", { x: 50, y: 700, size: 14, font });
  const page2 = fixtureDoc.addPage();
  page2.drawText("Zeugnis Seite 2", { x: 50, y: 700, size: 14, font });
  const fixtureBytes = await fixtureDoc.save();

  testPdfPath = path.join(UPLOAD_DIR, "test-pdfmerge-fixture.pdf");
  await fs.writeFile(testPdfPath, fixtureBytes);

  testPngPath = path.join(UPLOAD_DIR, "test-pdfmerge-fixture.png");
  await fs.writeFile(testPngPath, Buffer.from(TINY_PNG_BASE64, "base64"));

  // Ein größeres, unkomprimiertes PNG (simuliert einen Handy-/Scanner-Scan),
  // um die tatsächliche Größenreduktion durch die sharp-Kompression zu
  // verifizieren (die winzige 1x1-Fixture oben ist dafür nicht aussagekräftig).
  largePngPath = path.join(UPLOAD_DIR, "test-pdfmerge-large.png");
  const largePng = await sharp({
    create: {
      width: 2400,
      height: 3200,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
      noise: { type: "gaussian", mean: 128, sigma: 40 },
    },
  })
    .png()
    .toBuffer();
  await fs.writeFile(largePngPath, largePng);

  unsupportedPath = path.join(UPLOAD_DIR, "test-pdfmerge-fixture.docx");
  await fs.writeFile(unsupportedPath, "kein echtes docx, nur zum Testen des Überspringens");
});

afterAll(async () => {
  await Promise.all(
    [testPdfPath, testPngPath, largePngPath, unsupportedPath].map((p) => fs.rm(p, { force: true }).catch(() => {}))
  );
});

async function pageCount(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPageCount();
}

describe("createApplicationPdfPackage", () => {
  it("rendert das Anschreiben als eigene PDF-Seite, auch ohne angehängte Dokumente", async () => {
    const bytes = await createApplicationPdfPackage({
      coverLetterContent: "Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich.\n\nMit freundlichen Grüßen",
      documents: [],
    });
    expect(await pageCount(bytes)).toBeGreaterThanOrEqual(1);
  });

  it("liefert dennoch ein gültiges PDF ohne Anschreiben und ohne Dokumente (pdf-lib fügt eine leere Pflicht-Seite ein)", async () => {
    const bytes = await createApplicationPdfPackage({ coverLetterContent: null, documents: [] });
    expect(await pageCount(bytes)).toBeGreaterThanOrEqual(0);
  });

  it("übernimmt alle Seiten eines angehängten PDF-Dokuments", async () => {
    const bytes = await createApplicationPdfPackage({
      coverLetterContent: null,
      documents: [{ name: "Zeugnis", fileUrl: "/uploads/test-pdfmerge-fixture.pdf" }],
    });
    expect(await pageCount(bytes)).toBe(2);
  });

  it("fügt ein angehängtes Bild als eigene Seite ein", async () => {
    const bytes = await createApplicationPdfPackage({
      coverLetterContent: null,
      documents: [{ name: "Scan", fileUrl: "/uploads/test-pdfmerge-fixture.png" }],
    });
    expect(await pageCount(bytes)).toBe(1);
  });

  it("kombiniert Anschreiben + PDF + Bild in der richtigen Reihenfolge", async () => {
    const bytes = await createApplicationPdfPackage({
      coverLetterContent: "Bewerbung als Test-Position\n\nSehr geehrte Damen und Herren,",
      documents: [
        { name: "Zeugnis", fileUrl: "/uploads/test-pdfmerge-fixture.pdf" },
        { name: "Scan", fileUrl: "/uploads/test-pdfmerge-fixture.png" },
      ],
    });
    // 1 Anschreiben-Seite + 2 PDF-Seiten + 1 Bild-Seite = 4
    expect(await pageCount(bytes)).toBe(4);
  });

  it("überspringt eine fehlende Datei, statt den gesamten Merge scheitern zu lassen", async () => {
    const bytes = await createApplicationPdfPackage({
      coverLetterContent: "Anschreiben-Text",
      documents: [{ name: "Verschwunden", fileUrl: "/uploads/does-not-exist-12345.pdf" }],
    });
    expect(await pageCount(bytes)).toBeGreaterThanOrEqual(1); // nur die Anschreiben-Seite(n)
  });

  it("überspringt nicht unterstützte Dateiformate (z.B. .docx), statt zu werfen", async () => {
    const bytesWithout = await createApplicationPdfPackage({ coverLetterContent: null, documents: [] });
    const bytesWithDocx = await createApplicationPdfPackage({
      coverLetterContent: null,
      documents: [{ name: "Word-Dokument", fileUrl: "/uploads/test-pdfmerge-fixture.docx" }],
    });
    // Das .docx darf keine zusätzliche Seite erzeugen (wird komplett ignoriert).
    expect(await pageCount(bytesWithDocx)).toBe(await pageCount(bytesWithout));
  });

  it("komprimiert/skaliert ein großes Bild deutlich, statt es unverändert einzubetten (Anhang-Größe für Jobportale)", async () => {
    const originalSize = (await fs.stat(largePngPath)).size;

    const bytes = await createApplicationPdfPackage({
      coverLetterContent: null,
      documents: [{ name: "Großer Scan", fileUrl: "/uploads/test-pdfmerge-large.png" }],
    });

    expect(await pageCount(bytes)).toBe(1);
    // Das PDF-Ergebnis (inkl. Container-Overhead) muss trotz eines mehrere
    // MB großen Quellbilds deutlich kleiner als das Original ausfallen.
    expect(bytes.length).toBeLessThan(originalSize * 0.5);
  });

  it("erzeugt bei langem Anschreiben-Text mehrere Seiten (automatischer Seitenumbruch)", async () => {
    const longParagraph = "Dies ist ein sehr langer Testsatz, der wiederholt wird. ".repeat(120);
    const bytes = await createApplicationPdfPackage({
      coverLetterContent: longParagraph,
      documents: [],
    });
    expect(await pageCount(bytes)).toBeGreaterThan(1);
  });
});
