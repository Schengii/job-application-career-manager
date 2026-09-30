// -----------------------------------------------------------------------------
// GET /api/applications/[id]/package/zip
// -----------------------------------------------------------------------------
// Lädt Anschreiben (HTML & TXT), Übersicht und alle verknüpften Dokumente
// zu einem fertigen .zip Archiv herunter.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { createApplicationZipPackage } from "@/lib/documents/zipPackage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      company: true,
      coverLetter: true,
      documents: { include: { document: true } },
    },
  });

  if (!app) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
  }

  try {
    const zipBuffer = await createApplicationZipPackage({
      position: app.position,
      companyName: app.company.name,
      coverLetterContent: app.coverLetter?.content ?? null,
      applicationDate: app.applicationDate,
      notes: app.notes,
      documents: app.documents.map((d) => ({
        name: d.document.name,
        fileName: d.document.fileName,
        fileUrl: d.document.fileUrl,
        category: d.document.category,
      })),
    });

    const safeCompany = app.company.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safePosition = app.position.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Bewerbung_${safeCompany}_${safePosition}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("ZIP creation error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des ZIP-Archivs" },
      { status: 500 }
    );
  }
}
