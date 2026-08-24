// -----------------------------------------------------------------------------
// GET /api/applications/[id]/package -> ZIP-Download des Bewerbungspakets
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { createApplicationZipPackage } from "@/lib/zipPackage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        company: true,
        coverLetter: true,
        documents: { include: { document: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
    }

    const zipBuffer = await createApplicationZipPackage({
      position: application.position,
      companyName: application.company.name,
      coverLetterContent: application.coverLetter?.content,
      applicationDate: application.applicationDate,
      notes: application.notes,
      documents: application.documents.map((d) => ({
        name: d.document.name,
        fileName: d.document.fileName,
        fileUrl: d.document.fileUrl,
        category: d.document.category,
      })),
    });

    const safeCompanyName = application.company.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safePosition = application.position.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `Bewerbung_${safeCompanyName}_${safePosition}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
