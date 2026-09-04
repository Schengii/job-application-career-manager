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
//
// Bewusst NICHT in einer einzigen DB-Transaktion mit der Application-Anlage:
// die Anschreiben-Generierung kann einen externen KI-Request auslösen
// (mehrere Sekunden Latenz, siehe generateOpeningSentenceWithAI() in
// aiService.ts) — eine Prisma-Transaktion sollte dafür nicht offen gehalten
// werden. Schlägt einer der Nachfolge-Schritte (Dokumente anhängen,
// Anschreiben generieren) fehl, bleibt die bereits angelegte Application
// bestehen; ensureStandardPackage() unten holt beim NÄCHSTEN Aufruf (Klick
// auf "Bewerben" führt bei bereits vorhandener Bewerbung erneut hierher,
// siehe `existing`-Zweig) gezielt nur die fehlenden Teile nach, statt die
// unvollständige Bewerbung stillschweigend als "fertig" zurückzugeben.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";
import { generateCoverLetter } from "@/lib/documents/coverLetterGenerator";
import { getPreferencesWithProfile } from "@/lib/settings/preferences";
import type { Application, Company, JobPosting } from "@/types";

type Params = { params: Promise<{ id: string }> };

/**
 * Stellt sicher, dass eine Application das vollständige Standardpaket hat
 * (Standard-Dokumente angehängt + Anschreiben vorhanden) — hängt nur die
 * jeweils FEHLENDEN Teile an, überspringt bereits vorhandene. Kann daher
 * gefahrlos mehrfach für dieselbe Application aufgerufen werden (z.B. wenn
 * ein vorheriger Aufruf nach der Application-Anlage, aber vor Abschluss
 * dieser Funktion fehlgeschlagen ist).
 */
async function ensureStandardPackage(application: Application & { company: Company; jobPosting: JobPosting | null }) {
  const [defaultDocuments, alreadyAttached, existingCoverLetter] = await Promise.all([
    prisma.document.findMany({ where: { isDefault: true }, select: { id: true } }),
    prisma.applicationDocument.findMany({ where: { applicationId: application.id }, select: { documentId: true } }),
    prisma.coverLetter.findUnique({ where: { applicationId: application.id } }),
  ]);

  const attachedIds = new Set(alreadyAttached.map((a) => a.documentId));
  const toAttach = defaultDocuments.filter((doc) => !attachedIds.has(doc.id));
  if (toAttach.length > 0) {
    await prisma.applicationDocument.createMany({
      data: toAttach.map((doc) => ({ applicationId: application.id, documentId: doc.id })),
    });
  }

  if (!existingCoverLetter) {
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
  }
}

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
      include: { company: true, jobPosting: true },
    });

    const application =
      existing ??
      (await prisma.application.create({
        data: {
          position: job.title,
          status: "DRAFT",
          companyId,
          jobPostingId: job.id,
          source: job.portalSource,
          statusEvents: { create: { status: "DRAFT", note: "Bewerbung aus Stellenangebot erstellt" } },
        },
        include: { company: true, jobPosting: true, statusEvents: true },
      }));

    // Holt fehlende Standard-Dokumente/Anschreiben nach — auch im
    // `existing`-Zweig, falls ein vorheriger Aufruf hier zuvor fehlgeschlagen
    // war (siehe Docblock oben).
    await ensureStandardPackage(application);

    const applicationWithPackage = await prisma.application.findUniqueOrThrow({
      where: { id: application.id },
      include: { company: true, jobPosting: true, statusEvents: true, coverLetter: true, documents: true },
    });

    return NextResponse.json(applicationWithPackage, { status: existing ? 200 : 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
