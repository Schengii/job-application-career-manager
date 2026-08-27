// -----------------------------------------------------------------------------
// GET /api/applications/[id]/package/pdf -> EIN kombiniertes PDF (Anschreiben
// + angehängte Dokumente), siehe src/lib/pdfMerge.ts. Alternative zum
// ZIP-Export unter /api/applications/[id]/package.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { createApplicationPdfPackage } from "@/lib/pdfMerge";

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

    const pdfBytes = await createApplicationPdfPackage({
      coverLetterContent: application.coverLetter?.content,
      documents: application.documents.map((d) => ({
        name: d.document.name,
        fileUrl: d.document.fileUrl,
        mimeType: d.document.mimeType,
        category: d.document.category,
      })),
    });

    const safeCompanyName = application.company.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safePosition = application.position.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `Bewerbung_${safeCompanyName}_${safePosition}.pdf`;

    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
