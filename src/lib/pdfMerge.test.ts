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
let lebenslaufPdfPath: string;

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

  // Ein-Seiten-PDF als Lebenslauf-Fixture mit einer bewusst UNGEWÖHNLICHEN,
  // eindeutig wiedererkennbaren Seitengröße (statt der A4/Letter-Größen der
  // anderen Fixtures) — so lässt sich die Sortierung (sortDocumentsForPackage())
  // über `getSize()` verifizieren, ohne Text aus dem gemergten PDF extrahieren
  // zu müssen (das kann pdf-lib nicht).
  const LEBENSLAUF_FIXTURE_SIZE: [number, number] = [400, 500];
  const lebenslaufDoc = await PDFDocument.create();
  lebenslaufDoc.addPage(LEBENSLAUF_FIXTURE_SIZE);
  lebenslaufPdfPath = path.join(UPLOAD_DIR, "test-pdfmerge-lebenslauf.pdf");
  await fs.writeFile(lebenslaufPdfPath, await lebenslaufDoc.save());

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
    [testPdfPath, testPngPath, largePngPath, unsupportedPath, lebenslaufPdfPath].map((p) => fs.rm(p, { force: true }).catch(() => {}))
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

  it("setzt den Lebenslauf (category: LEBENSLAUF) direkt nach dem Anschreiben, unabhängig von der Anhang-Reihenfolge", async () => {
    const bytes = await createApplicationPdfPackage({
      coverLetterContent: "Bewerbung als Test-Position\n\nSehr geehrte Damen und Herren,",
      documents: [
        // Zeugnis wird bewusst VOR dem Lebenslauf übergeben — die Sortierung
        // muss den Lebenslauf trotzdem an die erste Stelle (direkt nach dem
        // Anschreiben) ziehen.
        { name: "Zeugnis", fileUrl: "/uploads/test-pdfmerge-fixture.pdf", category: "ZEUGNIS_AUSBILDUNG" },
        { name: "Lebenslauf", fileUrl: "/uploads/test-pdfmerge-lebenslauf.pdf", category: "LEBENSLAUF" },
      ],
    });

    const doc = await PDFDocument.load(bytes);
    // Seite 0 = Anschreiben, Seite 1 muss die Lebenslauf-Fixture sein
    // (eindeutig an ihrer ungewöhnlichen Seitengröße erkennbar).
    const lebenslaufPage = doc.getPages()[1];
    expect([lebenslaufPage.getWidth(), lebenslaufPage.getHeight()]).toEqual([400, 500]);
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

  it("passt ein realistisch langes Anschreiben (~2700 Zeichen, wie ein echtes Anschreiben) auf genau eine Seite", async () => {
    const realisticBody = [
      "mit großem Interesse habe ich Ihre Stellenanzeige für die Position als Frontend-Entwickler bei Acme GmbH gelesen.",
      "",
      "technik und komplexe Systeme haben mich schon immer fasziniert – früher beim Programmieren von industriellen Produktionsanlagen als Elektroniker, heute beim Entwickeln von modernen, nutzerfreundlichen Web- und App-Anwendungen. Nach einer gesundheitsbedingten beruflichen Neuorientierung habe ich im Juni 2026 meine Umschulung zum Fachinformatiker für Anwendungsentwicklung erfolgreich abgeschlossen. Nun brenne ich darauf, mein erlerntes Wissen in Ihrem Entwicklungsteam in die Praxis umzusetzen und echten Mehrwert zu schaffen.",
      "",
      "Während meines zweijährigen Betriebspraktikums bei der Deutschen Forschungsgemeinschaft (DFG) in Bonn konnte ich mich von Beginn an in einem professionellen Entwicklungsumfeld einbringen. Mein technischer Schwerpunkt lag hierbei auf der modernen Frontend-Entwicklung mit HTML5, CSS3 und JavaScript, gefolgt von einer intensiven Spezialisierung auf TypeScript und modulare Frontend-Architekturen.",
      "",
      "Wie zielgerichtet ich neue Technologien kombiniere, zeigt mein eigenständig realisiertes Abschlussprojekt, eine mobile-first Web- und App-Anwendung. Hierbei habe ich eine externe API via REST-Schnittstelle angebunden, um basierend auf flexiblen Benutzereingaben dynamisch Inhalte zu generieren.",
      "",
      "Als gelernter Elektroniker für Betriebstechnik arbeitete ich mit Word, Excel und Gimp und programmierte im Tia-Portal und in Grafcet für eine speicherprogrammierbare Steuerung (SPS). Nach der Ausbildung wechselte ich den Betrieb sowie die Tätigkeit und war für fast 1,5 Jahre als Prüftechniker im Außendienst deutschlandweit unterwegs.",
      "",
      "Für den Einstieg in Ihre Projekte stehe ich Ihnen ab sofort zur Verfügung. Ich freue mich auf die Gelegenheit, mich Ihnen in einem persönlichen Gespräch vorzustellen.",
    ].join("\n");

    const bytes = await createApplicationPdfPackage({
      coverLetterContent: `Max Mustermann\nMusterstraße 1\n53111 Bonn\n\nAcme GmbH\nMusterweg 1\n50667 Köln\n\n27. August 2026\n\nBewerbung als Frontend-Entwickler\n\nSehr geehrte Damen und Herren,\n\n${realisticBody}\n\nMit freundlichen Grüßen\nMax Mustermann`,
      documents: [],
    });

    expect(await pageCount(bytes)).toBe(1);
  });

  it("erzeugt bei extrem langem Anschreiben-Text mehrere Seiten (Fallback, wenn selbst die kleinste Schriftgröße nicht mehr reicht)", async () => {
    // Deutlich länger als jedes echte Anschreiben — die Auto-Fit-Logik
    // (findFontSizeForOnePage()) schrumpft die Schrift bis zur konfigurierten
    // Untergrenze, ab der bewusst wieder mehrseitig umgebrochen wird, statt
    // unleserlich klein zu werden (siehe pdfMerge.ts).
    const longParagraph = "Dies ist ein sehr langer Testsatz, der wiederholt wird. ".repeat(400);
    const bytes = await createApplicationPdfPackage({
      coverLetterContent: longParagraph,
      documents: [],
    });
    expect(await pageCount(bytes)).toBeGreaterThan(1);
  });
});
