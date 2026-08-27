// -----------------------------------------------------------------------------
// POST /api/jobs/:id/apply
// -----------------------------------------------------------------------------
// Der "Bewerben"-Button auf einem Stellenangebot: legt (falls noch nicht
// vorhanden) eine Bewerbung im Status "DRAFT" an, verknüpft Unternehmen &
// Stelle und protokolliert das direkt als ersten Status-Event. Um den
// eigentlichen Zeitgewinn dieses Buttons zu maximieren, wird direkt danach
// automatisch das komplette "Standard-Bewerbungspaket" vorbereitet:
//   - alle als Standard markierten Dokumente (Document.isDefault, siehe
//     Einstellungen → Dokumente) werden angehängt
//   - ein Anschreiben wird aus dem festen Vorlagentext generiert (siehe
//     Einstellungen → Profil & Präferenzen, coverLetterGenerator.ts) — nur
//     Empfänger-Adresse, Datum, Anrede & ein individueller, ggf. per KI
//     erzeugter Einleitungssatz werden ausgetauscht
// Beides bleibt im Bewerbungs-Detail jederzeit änderbar/ersetzbar.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { generateCoverLetter } from "@/lib/coverLetterGenerator";
import { getPreferencesWithProfile } from "@/lib/preferences";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const job = await prisma.jobPosting.findUnique({ where: { id }, include: { company: true } });
    if (!job) return NextResponse.json({ error: "Stellenangebot nicht gefunden" }, { status: 404 });

    let companyId = job.companyId;
    if (!companyId) {
      const company = await prisma.company.create({ data: { name: "Unbekanntes Unternehmen" } });
      companyId = company.id;
    }

    const existing = await prisma.application.findFirst({
      where: { jobPostingId: job.id },
    });
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const application = await prisma.application.create({
      data: {
        position: job.title,
        status: "DRAFT",
        companyId,
        jobPostingId: job.id,
        source: job.portalSource,
        statusEvents: { create: { status: "DRAFT", note: "Bewerbung aus Stellenangebot erstellt" } },
      },
      include: { company: true, jobPosting: true, statusEvents: true },
    });

    // Standard-Dokumente automatisch anhängen (z.B. Lebenslauf, Zeugnisse) —
    // erst danach mitgezählt/zurückgegeben, damit ein Fehler hier den
    // eigentlichen "Bewerbung anlegen"-Schritt nicht scheitern lässt.
    // Kein `skipDuplicates` nötig (von SQLite in Prisma ohnehin nicht
    // unterstützt): Die Bewerbung wurde gerade erst angelegt, es können also
    // noch keine ApplicationDocument-Einträge für sie existieren.
    const defaultDocuments = await prisma.document.findMany({ where: { isDefault: true }, select: { id: true } });
    if (defaultDocuments.length > 0) {
      await prisma.applicationDocument.createMany({
        data: defaultDocuments.map((doc) => ({ applicationId: application.id, documentId: doc.id })),
      });
    }

    // Anschreiben automatisch aus dem festen Vorlagentext generieren (siehe
    // src/lib/coverLetterGenerator.ts) — nutzt ggf. den für dieses
    // Unternehmen hinterlegten eigenen Einleitungssatz.
    const profile = await getPreferencesWithProfile();
    const { content: coverLetterContent } = await generateCoverLetter({
      company: application.company,
      job: application.jobPosting,
      profile,
      position: application.position,
    });
    await prisma.coverLetter.create({
      data: { applicationId: application.id, content: coverLetterContent, status: "DRAFT" },
    });

    const applicationWithPackage = await prisma.application.findUniqueOrThrow({
      where: { id: application.id },
      include: { company: true, jobPosting: true, statusEvents: true, coverLetter: true, documents: true },
    });

    return NextResponse.json(applicationWithPackage, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
