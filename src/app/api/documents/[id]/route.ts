// -----------------------------------------------------------------------------
// GET/PATCH/DELETE /api/documents/:id
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { documentUpdateSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
  return NextResponse.json(document);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = documentUpdateSchema.parse(body);
    const document = await prisma.document.update({ where: { id }, data });
    return NextResponse.json(document);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const document = await prisma.document.delete({ where: { id } });

    // Zugehörige Datei aus dem Upload-Verzeichnis entfernen (falls vorhanden)
    if (document.fileUrl?.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", document.fileUrl);
      await fs.unlink(filePath).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
