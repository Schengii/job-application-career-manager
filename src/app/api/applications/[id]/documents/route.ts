// -----------------------------------------------------------------------------
// POST   /api/applications/:id/documents  -> Vorhandenes Dokument anhängen
// DELETE /api/applications/:id/documents  -> Dokument entfernen (?documentId=)
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const attachSchema = z.object({ documentId: z.string().min(1) });

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { documentId } = attachSchema.parse(await request.json());

    await prisma.applicationDocument.upsert({
      where: { applicationId_documentId: { applicationId: id, documentId } },
      update: {},
      create: { applicationId: id, documentId },
    });

    const application = await prisma.application.findUnique({
      where: { id },
      include: { documents: { include: { document: true } } },
    });
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const documentId = request.nextUrl.searchParams.get("documentId");
    if (!documentId) {
      return NextResponse.json({ error: "documentId ist erforderlich" }, { status: 400 });
    }
    await prisma.applicationDocument.delete({
      where: { applicationId_documentId: { applicationId: id, documentId } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
