// -----------------------------------------------------------------------------
// POST /api/cover-letters/generate
// -----------------------------------------------------------------------------
// Generiert auf Knopfdruck ein maßgeschneidertes Anschreiben für eine
// bestehende Bewerbung: kombiniert Unternehmensdaten + (optionales)
// Stellenangebot + Profil/Präferenzen und speichert das Ergebnis als
// CoverLetter-Eintrag mit Status "DRAFT" (oder aktualisiert einen
// bestehenden Entwurf).
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { coverLetterGenerateSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";
import { generateCoverLetter, type CoverLetterTone } from "@/lib/coverLetterGenerator";
import { getPreferencesWithProfile } from "@/lib/preferences";

export async function POST(request: NextRequest) {
  try {
    const { applicationId, tone, highlightProjectTitle } = coverLetterGenerateSchema.parse(await request.json());

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { company: true, jobPosting: true, coverLetter: true },
    });
    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
    }

    const profile = await getPreferencesWithProfile();

    // Explizit übergebene Tonalität hat Vorrang, sonst greift die für dieses
    // Unternehmen hinterlegte Standard-Tonalität (Company.preferredTone),
    // ansonsten der generatorseitige Default ("MODERN").
    const effectiveTone = tone ?? (application.company.preferredTone as CoverLetterTone | null) ?? undefined;

    const content = generateCoverLetter({
      company: application.company,
      job: application.jobPosting,
      profile,
      position: application.position,
      tone: effectiveTone,
      highlightProjectTitle,
    });

    const coverLetter = await prisma.coverLetter.upsert({
      where: { applicationId },
      update: { content, status: "DRAFT" },
      create: { applicationId, content, status: "DRAFT" },
    });

    return NextResponse.json(coverLetter, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
