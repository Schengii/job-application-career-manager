// -----------------------------------------------------------------------------
// GET / POST /api/applications/[id]/pdf-package -> Zusammengeführte PDF-Bewerbungsmappe
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";
import { createApplicationPdfPackage } from "@/lib/documents/pdfMerge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const includeCoverSheet = url.searchParams.get("includeCoverSheet") === "true";
    const includeCoverLetter = url.searchParams.get("includeCoverLetter") !== "false";
    const rawDocIds = url.searchParams.get("documentIds");
    const allowedDocIds = rawDocIds ? rawDocIds.split(",").map((s) => s.trim()).filter(Boolean) : null;

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

    const preferences = await prisma.preferences.findUnique({
      where: { id: "default" },
    });

    let selectedDocs = application.documents.map((d) => d.document);
    if (allowedDocIds) {
      selectedDocs = selectedDocs.filter((doc) => allowedDocIds.includes(doc.id));
    }

    const documentTitles: string[] = [];
    if (includeCoverLetter && application.coverLetter?.content) {
      documentTitles.push("Anschreiben");
    }
    selectedDocs.forEach((doc) => documentTitles.push(doc.name));

    const pdfBytes = await createApplicationPdfPackage({
      coverSheet: includeCoverSheet
        ? {
            applicantName: preferences?.fullName || undefined,
            applicantEmail: preferences?.email || undefined,
            applicantPhone: preferences?.phone || undefined,
            applicantCity: preferences?.city || undefined,
            position: application.position,
            companyName: application.company.name,
            documentTitles,
          }
        : null,
      coverLetterContent: includeCoverLetter ? application.coverLetter?.content : null,
      documents: selectedDocs.map((doc) => ({
        name: doc.name,
        fileUrl: doc.fileUrl,
        category: doc.category,
        mimeType: doc.mimeType,
      })),
    });

    const safeCompanyName = application.company.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safePosition = application.position.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `Bewerbungsmappe_${safeCompanyName}_${safePosition}.pdf`;

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
