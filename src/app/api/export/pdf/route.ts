// -----------------------------------------------------------------------------
// PDF Export API Route: /api/export/pdf
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { wrapHtmlForPdfExport, PdfExportOptions } from "@/lib/pdfExport";
import { handleApiError } from "@/lib/apiUtils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PdfExportOptions & { filename?: string };

    if (!body.htmlContent) {
      return NextResponse.json({ error: "htmlContent ist erforderlich." }, { status: 400 });
    }

    const title = body.title || "Dokument";
    const filename = body.filename || `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.html`;

    const wrappedHtml = wrapHtmlForPdfExport({
      title,
      htmlContent: body.htmlContent,
      documentType: body.documentType || "CV",
    });

    return new NextResponse(wrappedHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
