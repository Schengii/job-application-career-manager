// -----------------------------------------------------------------------------
// PDF-Paket-Generator: fasst Anschreiben + angehängte Dokumente (PDFs & Scans)
// zu EINER einzigen, direkt versandfertigen PDF-Datei zusammen — statt eines
// ZIP-Archivs mit einzelnen Dateien (siehe src/lib/zipPackage.ts, weiterhin
// als Alternative verfügbar). Rein serverseitig mit `pdf-lib`, ohne
// Headless-Browser-Abhängigkeit (bewusst leichtgewichtig, damit es auch ohne
// Chromium-Binary läuft, egal wo diese App gehostet wird).
// -----------------------------------------------------------------------------
import { promises as fs } from "fs";
import path from "path";
import { PDFDocument, StandardFonts, PageSizes, type PDFFont } from "pdf-lib";

const FONT_SIZE = 11;
const LINE_HEIGHT = FONT_SIZE * 1.45;
const PARAGRAPH_GAP = LINE_HEIGHT * 0.55;
// ~20mm Rand (1mm ≈ 2.8346pt), analog zu den @page-Regeln in src/lib/pdfExport.ts
const MARGIN = 56.7;

/** Zerlegt eine Zeile in Teilzeilen, die jeweils innerhalb `maxWidth` passen. */
function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Rendert einen Text (z.B. das generierte Anschreiben) als eigenständiges PDF mit Zeilenumbruch & automatischem Seitenumbruch. */
async function renderTextAsPdf(content: string): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const [pageWidth, pageHeight] = PageSizes.A4;
  const maxWidth = pageWidth - MARGIN * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - MARGIN;

  function ensureSpace() {
    if (y < MARGIN) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - MARGIN;
    }
  }

  for (const rawLine of content.split("\n")) {
    if (rawLine.trim() === "") {
      y -= PARAGRAPH_GAP;
      continue;
    }
    // Die Betreffzeile ("Bewerbung als ...", siehe coverLetterGenerator.ts)
    // wird fett hervorgehoben, analog zur Druckvorschau im Browser.
    const useFont = rawLine.startsWith("Bewerbung als") ? boldFont : font;
    for (const wrapped of wrapLine(rawLine, useFont, FONT_SIZE, maxWidth)) {
      ensureSpace();
      page.drawText(wrapped, { x: MARGIN, y, size: FONT_SIZE, font: useFont });
      y -= LINE_HEIGHT;
    }
  }

  return pdfDoc;
}

/** Fügt ein Bild (z.B. ein gescanntes Zeugnis) als eigene, zentrierte A4-Seite ein. */
async function appendImagePage(merged: PDFDocument, bytes: Buffer, kind: "png" | "jpg"): Promise<void> {
  const image = kind === "png" ? await merged.embedPng(bytes) : await merged.embedJpg(bytes);
  const [pageWidth, pageHeight] = PageSizes.A4;
  const maxW = pageWidth - MARGIN * 2;
  const maxH = pageHeight - MARGIN * 2;
  const scale = Math.min(maxW / image.width, maxH / image.height);
  const w = image.width * scale;
  const h = image.height * scale;

  const page = merged.addPage([pageWidth, pageHeight]);
  page.drawImage(image, { x: (pageWidth - w) / 2, y: (pageHeight - h) / 2, width: w, height: h });
}

async function readUploadedFile(fileUrl: string): Promise<Buffer | null> {
  try {
    // fileUrl ist z.B. "/uploads/123-lebenslauf.pdf" (siehe zipPackage.ts)
    const relativePath = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    const absolutePath = path.join(process.cwd(), "public", relativePath);
    return await fs.readFile(absolutePath);
  } catch {
    // Datei lokal nicht (mehr) vorhanden -> wird beim Merge übersprungen,
    // statt das gesamte Paket scheitern zu lassen.
    return null;
  }
}

export type MergeDocumentInput = {
  name: string;
  fileUrl?: string | null;
  mimeType?: string | null;
};

export type MergeApplicationPdfParams = {
  coverLetterContent?: string | null;
  documents: MergeDocumentInput[];
};

/**
 * Erstellt EIN kombiniertes PDF aus dem generierten Anschreiben (als eigene
 * Textseite(n)) gefolgt von allen angehängten Dokumenten in ihrer
 * Anhang-Reihenfolge: bestehende PDFs werden seitenweise übernommen, Bilder
 * (PNG/JPEG, z.B. gescannte Zeugnisse) werden als eigene Seite eingefügt.
 * Andere Formate (z.B. .docx) werden übersprungen, da sie sich ohne externe
 * Konvertierung nicht verlustfrei in ein PDF einbetten lassen — sie bleiben
 * über den ZIP-Export (src/lib/zipPackage.ts) weiterhin separat verfügbar.
 * Ein einzelnes fehlerhaftes/fehlendes Dokument bricht den restlichen Merge
 * nicht ab (siehe readUploadedFile()/try-catch pro Dokument).
 */
export async function createApplicationPdfPackage(params: MergeApplicationPdfParams): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  if (params.coverLetterContent?.trim()) {
    const coverDoc = await renderTextAsPdf(params.coverLetterContent);
    const copiedPages = await merged.copyPages(coverDoc, coverDoc.getPageIndices());
    for (const p of copiedPages) merged.addPage(p);
  }

  for (const doc of params.documents) {
    if (!doc.fileUrl) continue;
    const bytes = await readUploadedFile(doc.fileUrl);
    if (!bytes) continue;

    const ext = path.extname(doc.fileUrl).toLowerCase();
    try {
      if (ext === ".pdf") {
        const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copiedPages = await merged.copyPages(srcDoc, srcDoc.getPageIndices());
        for (const p of copiedPages) merged.addPage(p);
      } else if (ext === ".png") {
        await appendImagePage(merged, bytes, "png");
      } else if (ext === ".jpg" || ext === ".jpeg") {
        await appendImagePage(merged, bytes, "jpg");
      }
      // Andere Endungen (z.B. .docx, .txt) bewusst übersprungen (s. Docblock oben).
    } catch (error) {
      console.error(`pdfMerge: Dokument "${doc.name}" (${doc.fileUrl}) konnte nicht eingebunden werden.`, error);
    }
  }

  return merged.save();
}
