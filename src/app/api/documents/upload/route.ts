// -----------------------------------------------------------------------------
// POST /api/documents/upload  (multipart/form-data)
// -----------------------------------------------------------------------------
// Nimmt eine Datei (Lebenslauf, Zeugnis, Referenz, ...) entgegen, speichert
// sie unter /public/uploads und legt den zugehörigen Document-Eintrag in der
// Datenbank an. Erwartete Felder: file, name, category, description?
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_DOCUMENT_UPLOADS,
  DOCUMENT_CATEGORY_VALUES,
} from "@/lib/constants";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx).toLowerCase();
}

/**
 * Prüft Dateityp gegen die Allowlist in `src/lib/constants.ts` — sowohl den
 * vom Client mitgesendeten MIME-Type als auch die Dateiendung müssen zu
 * EINEM der erlaubten Typen passen (nicht unabhängig voneinander), damit ein
 * Angreifer nicht z. B. eine `.html`-Datei mit vorgetäuschtem
 * `Content-Type: application/pdf` einschleusen kann. Siehe Kommentar bei
 * `ALLOWED_DOCUMENT_UPLOADS` für die Begründung (gespeicherte XSS-Lücke).
 */
function isAllowedUpload(mimeType: string, fileName: string): boolean {
  const extension = getExtension(fileName);
  if (!extension || !ALLOWED_DOCUMENT_EXTENSIONS.includes(extension as (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number])) {
    return false;
  }
  return ALLOWED_DOCUMENT_UPLOADS.some(
    (t) => t.mimeType === mimeType && (t.extensions as readonly string[]).includes(extension)
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const name = formData.get("name")?.toString() || (file instanceof File ? file.name : "Dokument");
    const category = formData.get("category")?.toString();
    const description = formData.get("description")?.toString() || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Datei übermittelt" }, { status: 400 });
    }
    if (!category || !DOCUMENT_CATEGORY_VALUES.includes(category as (typeof DOCUMENT_CATEGORY_VALUES)[number])) {
      return NextResponse.json({ error: "Ungültige Kategorie" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Datei ist zu groß (max. 10 MB)" }, { status: 400 });
    }
    if (!isAllowedUpload(file.type, file.name)) {
      return NextResponse.json(
        {
          error: `Dateityp nicht erlaubt. Erlaubt sind: ${ALLOWED_DOCUMENT_EXTENSIONS.join(", ")} (MIME-Types: ${ALLOWED_DOCUMENT_MIME_TYPES.join(", ")})`,
        },
        { status: 400 }
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const uniqueName = `${Date.now()}-${sanitizeFileName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, uniqueName), buffer);

    const document = await prisma.document.create({
      data: {
        name,
        category,
        description,
        fileName: file.name,
        fileUrl: `/uploads/${uniqueName}`,
        mimeType: file.type || null,
        fileSize: file.size,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
