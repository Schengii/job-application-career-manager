// -----------------------------------------------------------------------------
// POST /api/applications/[id]/send-email -> Direktversand via SMTP
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";
import { getOrCreatePreferences } from "@/lib/settings/preferences";
import { sendApplicationEmail } from "@/lib/email/smtpClient";
import { createApplicationPdfPackage } from "@/lib/documents/pdfMerge";
import { z } from "zod";

const sendEmailSchema = z.object({
  recipient: z.string().email(),
  subject: z.string().min(3),
  bodyText: z.string().min(10),
  attachPdfPackage: z.boolean().default(true),
  includeCoverSheet: z.boolean().default(true),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = sendEmailSchema.parse(body);

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

    const preferences = await getOrCreatePreferences();

    let pdfAttachment: { filename: string; content: Buffer } | undefined;

    if (data.attachPdfPackage) {
      const selectedDocs = application.documents.map((d) => d.document);
      const documentTitles: string[] = [];
      if (application.coverLetter?.content) {
        documentTitles.push("Anschreiben");
      }
      selectedDocs.forEach((doc) => documentTitles.push(doc.name));

      const pdfBytes = await createApplicationPdfPackage({
        coverSheet: data.includeCoverSheet
          ? {
              applicantName: preferences.fullName || undefined,
              applicantEmail: preferences.email || undefined,
              applicantPhone: preferences.phone || undefined,
              applicantCity: preferences.city || undefined,
              position: application.position,
              companyName: application.company.name,
              documentTitles,
            }
          : null,
        coverLetterContent: application.coverLetter?.content || null,
        documents: selectedDocs.map((doc) => ({
          name: doc.name,
          category: doc.category,
          fileName: doc.fileName || doc.name,
          fileUrl: doc.fileUrl,
          mimeType: doc.mimeType,
        })),
      });

      const sanitizedCompany = application.company.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      pdfAttachment = {
        filename: `bewerbung-${sanitizedCompany}.pdf`,
        content: Buffer.from(pdfBytes),
      };
    }

    const sendResult = await sendApplicationEmail(preferences, {
      to: data.recipient,
      subject: data.subject,
      bodyText: data.bodyText,
      pdfAttachment,
    });

    if (!sendResult.success) {
      return NextResponse.json({ error: sendResult.error || "Versand fehlgeschlagen" }, { status: 500 });
    }

    // In Historie protokollieren
    await prisma.applicationInteraction.create({
      data: {
        applicationId: application.id,
        type: "EMAIL",
        title: `Bewerbung per E-Mail versendet: ${data.subject}`,
        summary: `Empfänger: ${data.recipient}${pdfAttachment ? " (inkl. PDF-Mappe)" : ""}`,
      },
    });

    // Falls Status noch DRAFT ist, auf SENT setzen
    if (application.status === "DRAFT") {
      await prisma.application.update({
        where: { id: application.id },
        data: {
          status: "SENT",
          applicationDate: new Date(),
          statusEvents: {
            create: {
              status: "SENT",
              note: `Direkt per SMTP versendet an ${data.recipient}`,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      messageId: sendResult.messageId,
      message: "Bewerbung erfolgreich per E-Mail versendet!",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
