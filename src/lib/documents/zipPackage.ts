// -----------------------------------------------------------------------------
// ZIP-Paket Generator für Bewerbungsunterlagen
// -----------------------------------------------------------------------------
// Bündelt das Anschreiben (als .txt und formatiertes HTML) sowie alle
// zugeordneten Dokumente (Lebenslauf, Zeugnisse, Referenzen) zu einem
// fertigen ZIP-Archiv für den Versand per E-Mail oder Portal-Upload.
// -----------------------------------------------------------------------------
import JSZip from "jszip";
import { promises as fs } from "fs";
import path from "path";

export type ApplicationPackageData = {
  position: string;
  companyName: string;
  coverLetterContent?: string | null;
  applicationDate?: Date | string | null;
  notes?: string | null;
  documents: {
    name: string;
    fileName?: string | null;
    fileUrl?: string | null;
    category: string;
  }[];
};

export async function createApplicationZipPackage(data: ApplicationPackageData): Promise<Buffer> {
  const zip = new JSZip();
  const folderName = `Bewerbung_${sanitizeName(data.companyName)}_${sanitizeName(data.position)}`;
  const folder = zip.folder(folderName) ?? zip;

  // 1. Anschreiben als Textdatei
  if (data.coverLetterContent) {
    folder.file("Anschreiben.txt", data.coverLetterContent);

    // Formatiertes druckbares HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Anschreiben - ${escapeHtml(data.position)} bei ${escapeHtml(data.companyName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111; max-width: 800px; margin: 40px auto; padding: 20px; }
    p { margin-bottom: 1em; }
    .subject { font-weight: bold; font-size: 1.1em; margin: 20px 0 10px 0; }
  </style>
</head>
<body>
  ${data.coverLetterContent
    .split("\n\n")
    .map((p) => {
      const isSubj = p.startsWith("Bewerbung als");
      return `<p class="${isSubj ? "subject" : ""}">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n")}
</body>
</html>`;
    folder.file("Anschreiben.html", htmlContent);
  }

  // 2. Übersichts-Datei
  const summary = [
    `BEWERBUNGSUNTERLAGEN`,
    `====================`,
    `Unternehmen: ${data.companyName}`,
    `Position:    ${data.position}`,
    `Datum:       ${data.applicationDate ? new Date(data.applicationDate).toLocaleDateString("de-DE") : "k.A."}`,
    `Notizen:     ${data.notes || "Keine"}`,
    ``,
    `Enthaltene Dokumente:`,
    ...data.documents.map((d, i) => `  ${i + 1}. [${d.category}] ${d.name} (${d.fileName || "Datei"})`),
  ].join("\n");
  folder.file("Uebersicht.txt", summary);

  // 3. Dateien aus Vercel Blob (absolute HTTPS-URL) oder lokalem Pfad laden
  const docsFolder = folder.folder("Unterlagen") ?? folder;
  for (const doc of data.documents) {
    if (!doc.fileUrl) continue;
    try {
      let fileBuffer: Buffer;
      if (doc.fileUrl.startsWith("http://") || doc.fileUrl.startsWith("https://")) {
        const res = await fetch(doc.fileUrl);
        if (!res.ok) continue;
        fileBuffer = Buffer.from(await res.arrayBuffer());
      } else {
        // Fallback für lokale Entwicklung ohne Vercel Blob
        const relativePath = doc.fileUrl.startsWith("/") ? doc.fileUrl.slice(1) : doc.fileUrl;
        fileBuffer = await fs.readFile(path.join(process.cwd(), "public", relativePath));
      }
      const fileName = doc.fileName || path.basename(doc.fileUrl) || `${sanitizeName(doc.name)}.pdf`;
      docsFolder.file(fileName, fileBuffer);
    } catch {
      // Falls eine Datei nicht abrufbar ist, wird sie übersprungen
    }
  }

  const zipContent = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return zipContent;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
