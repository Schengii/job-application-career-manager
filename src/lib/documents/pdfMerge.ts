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
import { PDFDocument, StandardFonts, PageSizes, type PDFFont, rgb } from "pdf-lib";
import sharp from "sharp";

// Ein Anschreiben soll IMMER auf eine einzige DIN-A4-Seite passen (gängige
// Konvention für Bewerbungen) — statt einer fixen Schriftgröße wird deshalb
// mit MAX_FONT_SIZE begonnen und in kleinen Schritten verkleinert, bis der
// Text bei gegebener Zeilenhöhe/Rand rechnerisch auf eine Seite passt (siehe
// findFontSizeForOnePage() unten). So bleibt es unabhängig von der exakten
// Länge des (ggf. per KI individuell formulierten, siehe
// coverLetterGenerator.ts) Einleitungssatzes robust, statt bei einem
// zufällig etwas längeren Satz wieder auf zwei Seiten zu kippen.
const MAX_FONT_SIZE = 11;
const MIN_FONT_SIZE = 8.5;
const FONT_SIZE_STEP = 0.25;
const LINE_HEIGHT_RATIO = 1.22;
const PARAGRAPH_GAP_RATIO = LINE_HEIGHT_RATIO * 0.6;
// ~15mm Rand (1mm ≈ 2.8346pt) — etwas knapper als die 20mm der Druckvorschau
// (src/lib/pdfExport.ts), damit auch bei MAX_FONT_SIZE noch Spielraum für
// eine Seite bleibt, ohne den Text selbst kürzen zu müssen.
const MARGIN = 42.5;
// Zeugnis-Scans von Handy/Scanner liegen oft bei mehreren Megapixeln/mehreren
// MB unkomprimiert (PNG) — für A4-Druck reicht eine deutlich kleinere
// Auflösung völlig aus. 1600px auf der langen Seite entspricht bei A4-Breite
// (210mm) noch ca. 195 DPI, mehr als ausreichend für einen gestochen scharfen
// Ausdruck. Ohne diese Kompression würde das kombinierte PDF bei mehreren
// angehängten Scans leicht zweistellige MB-Werte erreichen — über dem
// Anhang-Limit mancher Jobportale (häufig 5-8 MB).
const MAX_IMAGE_DIMENSION_PX = 1600;
const IMAGE_JPEG_QUALITY = 82;

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

/** Zählt, wie viele gerenderte Zeilen (inkl. Wortumbruch) der Text bei einer gegebenen Schriftgröße benötigt, sowie die daraus resultierende Gesamthöhe in PDF-Punkten. */
function measureContent(
  content: string,
  font: PDFFont,
  boldFont: PDFFont,
  fontSize: number,
  maxWidth: number
): number {
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const paragraphGap = fontSize * PARAGRAPH_GAP_RATIO;
  let height = 0;

  for (const rawLine of content.split("\n")) {
    if (rawLine.trim() === "") {
      height += paragraphGap;
      continue;
    }
    const useFont = rawLine.startsWith("Bewerbung als") ? boldFont : font;
    height += wrapLine(rawLine, useFont, fontSize, maxWidth).length * lineHeight;
  }

  return height;
}

/**
 * Ermittelt die größte Schriftgröße (zwischen MIN_FONT_SIZE und
 * MAX_FONT_SIZE), bei der `content` noch komplett auf eine A4-Seite passt —
 * damit ein Anschreiben unabhängig von seiner genauen Länge immer eine
 * einzige Seite bleibt, statt bei etwas längerem Text (z.B. einem länger
 * formulierten KI-Einleitungssatz) ungewollt auf Seite 2 überzulaufen.
 * Erreicht der Text selbst bei MIN_FONT_SIZE keine eine Seite mehr, wird
 * MIN_FONT_SIZE zurückgegeben (dann läuft der Text bewusst über — lieber
 * lesbar auf zwei Seiten als unleserlich klein auf einer).
 */
function findFontSizeForOnePage(content: string, font: PDFFont, boldFont: PDFFont, maxWidth: number, maxHeight: number): number {
  for (let size = MAX_FONT_SIZE; size >= MIN_FONT_SIZE; size -= FONT_SIZE_STEP) {
    if (measureContent(content, font, boldFont, size, maxWidth) <= maxHeight) {
      return size;
    }
  }
  return MIN_FONT_SIZE;
}

/**
 * Rendert einen Text (z.B. das generierte Anschreiben) als eigenständiges
 * PDF — passt die Schriftgröße automatisch an, damit der Text auf eine
 * einzige DIN-A4-Seite passt (siehe findFontSizeForOnePage() oben), mit
 * automatischem Seitenumbruch als Fallback für den (seltenen) Fall, dass
 * selbst MIN_FONT_SIZE nicht ausreicht.
 */
async function renderTextAsPdf(content: string): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const [pageWidth, pageHeight] = PageSizes.A4;
  const maxWidth = pageWidth - MARGIN * 2;
  const maxHeight = pageHeight - MARGIN * 2;

  const fontSize = findFontSizeForOnePage(content, font, boldFont, maxWidth, maxHeight);
  const lineHeight = fontSize * LINE_HEIGHT_RATIO;
  const paragraphGap = fontSize * PARAGRAPH_GAP_RATIO;

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
      y -= paragraphGap;
      continue;
    }
    // Die Betreffzeile ("Bewerbung als ...", siehe coverLetterGenerator.ts)
    // wird fett hervorgehoben, analog zur Druckvorschau im Browser.
    const useFont = rawLine.startsWith("Bewerbung als") ? boldFont : font;
    for (const wrapped of wrapLine(rawLine, useFont, fontSize, maxWidth)) {
      ensureSpace();
      page.drawText(wrapped, { x: MARGIN, y, size: fontSize, font: useFont });
      y -= lineHeight;
    }
  }

  return pdfDoc;
}

/**
 * Fügt ein Bild (z.B. ein gescanntes Zeugnis) als eigene, zentrierte A4-Seite
 * ein — komprimiert/skaliert es vorher über `sharp` (siehe
 * MAX_IMAGE_DIMENSION_PX/IMAGE_JPEG_QUALITY oben), unabhängig vom
 * Quellformat (PNG/JPEG) einheitlich als JPEG eingebettet.
 */
async function appendImagePage(merged: PDFDocument, bytes: Buffer): Promise<void> {
  const compressed = await sharp(bytes)
    .rotate() // respektiert die EXIF-Ausrichtung von Handy-Fotos/-Scans
    .resize({
      width: MAX_IMAGE_DIMENSION_PX,
      height: MAX_IMAGE_DIMENSION_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: IMAGE_JPEG_QUALITY })
    .toBuffer();

  // WICHTIG: `sharp().toBuffer()` liefert einen Buffer, der aus Node's
  // internem Speicher-Pool geschnitten ist und daher einen `byteOffset` > 0
  // relativ zum zugrunde liegenden ArrayBuffer haben kann.
  // pdf-lib's JpegEmbedder greift intern auf .buffer zu und wirft
  // dadurch "SOI not found in JPEG", falls der ArrayBuffer nicht bei 0 beginnt.
  // Ein isolierter Slice des ArrayBuffers garantiert byteOffset 0.
  const isolatedBytes = new Uint8Array(
    compressed.buffer.slice(compressed.byteOffset, compressed.byteOffset + compressed.byteLength)
  );
  const image = await merged.embedJpg(isolatedBytes);
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
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      // Vercel Blob: absolute HTTPS-URL
      const res = await fetch(fileUrl);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    // Fallback für lokale Entwicklung ohne Vercel Blob
    const relativePath = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    const absolutePath = path.join(process.cwd(), "public", relativePath);
    return await fs.readFile(absolutePath);
  } catch {
    return null;
  }
}

export type MergeDocumentInput = {
  name: string;
  fileUrl?: string | null;
  mimeType?: string | null;
  category?: string | null;
};

export type CoverSheetOptions = {
  applicantName?: string | null;
  applicantEmail?: string | null;
  applicantPhone?: string | null;
  applicantCity?: string | null;
  position: string;
  companyName: string;
  documentTitles?: string[];
};

export type MergeApplicationPdfParams = {
  coverSheet?: CoverSheetOptions | null;
  coverLetterContent?: string | null;
  documents: MergeDocumentInput[];
};

/**
 * Erstellt ein modernes, stilvolles DIN-A4-Deckblatt für die Bewerbungsmappe
 * inkl. Akzentleiste, Positionsangabe, Unternehmensziel und Anlagenübersicht.
 */
async function renderCoverSheetPdf(sheet: CoverSheetOptions): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const [pageWidth, pageHeight] = PageSizes.A4;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Design-Akzent: vertikaler Farbbalken links (Indigo #4f46e5 -> rgb 79/255, 70/255, 229/255)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 24,
    height: pageHeight,
    color: rgb(79 / 255, 70 / 255, 229 / 255),
  });

  const contentX = 72; // ca. 25mm Rand links vom Akzentbalken

  // Subtitle / Label
  page.drawText("BEWERBUNGSDOSSIER", {
    x: contentX,
    y: pageHeight - 120,
    size: 11,
    font: boldFont,
    color: rgb(99 / 255, 102 / 255, 241 / 255),
  });

  // Haupttitel: Bewerbung als ...
  const title = `Bewerbung als ${sheet.position}`;
  page.drawText(title, {
    x: contentX,
    y: pageHeight - 155,
    size: 20,
    font: boldFont,
    color: rgb(15 / 255, 23 / 255, 42 / 255),
  });

  // Zielunternehmen
  page.drawText(`bei ${sheet.companyName}`, {
    x: contentX,
    y: pageHeight - 185,
    size: 14,
    font,
    color: rgb(71 / 255, 85 / 255, 105 / 255),
  });

  // Trennlinie
  page.drawLine({
    start: { x: contentX, y: pageHeight - 220 },
    end: { x: pageWidth - 60, y: pageHeight - 220 },
    thickness: 1,
    color: rgb(226 / 255, 232 / 255, 240 / 255),
  });

  // Bewerber-Kontaktdaten Block
  let infoY = pageHeight - 260;
  page.drawText("ANGABEN ZUR PERSON", {
    x: contentX,
    y: infoY,
    size: 10,
    font: boldFont,
    color: rgb(100 / 255, 116 / 255, 139 / 255),
  });

  infoY -= 24;
  if (sheet.applicantName) {
    page.drawText(sheet.applicantName, { x: contentX, y: infoY, size: 13, font: boldFont });
    infoY -= 18;
  }
  if (sheet.applicantEmail) {
    page.drawText(`E-Mail: ${sheet.applicantEmail}`, { x: contentX, y: infoY, size: 10, font });
    infoY -= 16;
  }
  if (sheet.applicantPhone) {
    page.drawText(`Telefon: ${sheet.applicantPhone}`, { x: contentX, y: infoY, size: 10, font });
    infoY -= 16;
  }
  if (sheet.applicantCity) {
    page.drawText(`Wohnort: ${sheet.applicantCity}`, { x: contentX, y: infoY, size: 10, font });
    infoY -= 16;
  }

  // Anlagenverzeichnis (Inhaltsübersicht)
  if (sheet.documentTitles && sheet.documentTitles.length > 0) {
    let anlagenY = pageHeight - 440;
    page.drawText("INHALT DIESER BEWERBUNGSMAPPE", {
      x: contentX,
      y: anlagenY,
      size: 10,
      font: boldFont,
      color: rgb(100 / 255, 116 / 255, 139 / 255),
    });

    anlagenY -= 22;
    sheet.documentTitles.forEach((docTitle, idx) => {
      page.drawText(`${idx + 1}.  ${docTitle}`, {
        x: contentX + 8,
        y: anlagenY,
        size: 11,
        font,
        color: rgb(30 / 255, 41 / 255, 59 / 255),
      });
      anlagenY -= 20;
    });
  }

  // Footer / Datum
  const dateString = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date());
  page.drawText(`Erstellt am ${dateString}`, {
    x: contentX,
    y: 50,
    size: 9,
    font,
    color: rgb(148 / 255, 163 / 255, 184 / 255),
  });

  return pdfDoc;
}

/**
 * Sortiert die angehängten Dokumente für eine sinnvolle Lesereihenfolge:
 * Lebenslauf direkt nach dem Anschreiben, alles andere (Zeugnisse etc.)
 * danach in der ursprünglichen Anhang-Reihenfolge. `Array.prototype.sort`
 * ist stabil (garantiert seit ES2019), daher bleibt die relative Reihenfolge
 * innerhalb jeder der beiden Gruppen erhalten.
 */
function sortDocumentsForPackage(documents: MergeDocumentInput[]): MergeDocumentInput[] {
  return [...documents].sort((a, b) => Number(b.category === "LEBENSLAUF") - Number(a.category === "LEBENSLAUF"));
}

/**
 * Erstellt EIN kombiniertes PDF aus dem generierten Anschreiben (als eigene
 * Textseite(n)) gefolgt vom Lebenslauf (falls unter den angehängten
 * Dokumenten vorhanden) und danach allen übrigen Dokumenten (siehe
 * sortDocumentsForPackage()): bestehende PDFs werden seitenweise übernommen,
 * Bilder (PNG/JPEG, z.B. gescannte Zeugnisse) werden als eigene Seite
 * eingefügt. Andere Formate (z.B. .docx) werden übersprungen, da sie sich
 * ohne externe Konvertierung nicht verlustfrei in ein PDF einbetten lassen —
 * sie bleiben über den ZIP-Export (src/lib/zipPackage.ts) weiterhin separat
 * verfügbar. Ein einzelnes fehlerhaftes/fehlendes Dokument bricht den
 * restlichen Merge nicht ab (siehe readUploadedFile()/try-catch pro Dokument).
 */
export async function createApplicationPdfPackage(params: MergeApplicationPdfParams): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  if (params.coverSheet) {
    const sheetDoc = await renderCoverSheetPdf(params.coverSheet);
    const copiedPages = await merged.copyPages(sheetDoc, sheetDoc.getPageIndices());
    for (const p of copiedPages) merged.addPage(p);
  }

  if (params.coverLetterContent?.trim()) {
    const coverDoc = await renderTextAsPdf(params.coverLetterContent);
    const copiedPages = await merged.copyPages(coverDoc, coverDoc.getPageIndices());
    for (const p of copiedPages) merged.addPage(p);
  }

  for (const doc of sortDocumentsForPackage(params.documents)) {
    if (!doc.fileUrl) continue;
    const bytes = await readUploadedFile(doc.fileUrl);
    if (!bytes) continue;

    const ext = path.extname(doc.fileUrl).toLowerCase();
    try {
      if (ext === ".pdf") {
        const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copiedPages = await merged.copyPages(srcDoc, srcDoc.getPageIndices());
        for (const p of copiedPages) merged.addPage(p);
      } else if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
        await appendImagePage(merged, bytes);
      }
      // Andere Endungen (z.B. .docx, .txt) bewusst übersprungen (s. Docblock oben).
    } catch (error) {
      console.error(`pdfMerge: Dokument "${doc.name}" (${doc.fileUrl}) konnte nicht eingebunden werden.`, error);
    }
  }

  return merged.save();
}
