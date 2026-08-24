// -----------------------------------------------------------------------------
// GET  /api/documents  -> Liste aller Dokumente
// POST /api/documents  -> Dokument-Metadaten anlegen (ohne Datei-Upload)
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { documentSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";

export async function GET() {
  const documents = await prisma.document.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = documentSchema.parse(body);
    const document = await prisma.document.create({ data });
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
