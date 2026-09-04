// -----------------------------------------------------------------------------
// POST /api/cover-letters/generate
// -----------------------------------------------------------------------------
// Generiert auf Knopfdruck ein Anschreiben für eine bestehende Bewerbung aus
// dem festen Vorlagentext (Preferences.standardCoverLetterBody, siehe
// coverLetterGenerator.ts) + Unternehmensdaten und speichert das Ergebnis als
// CoverLetter-Eintrag mit Status "DRAFT" (oder aktualisiert einen
// bestehenden Entwurf).
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { coverLetterGenerateSchema } from "@/lib/core/validation";
import { handleApiError } from "@/lib/core/apiUtils";
import { generateCoverLetter } from "@/lib/documents/coverLetterGenerator";
import { getPreferencesWithProfile } from "@/lib/settings/preferences";

export async function POST(request: NextRequest) {
  try {
    const { applicationId } = coverLetterGenerateSchema.parse(await request.json());

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { company: true, jobPosting: true, coverLetter: true },
    });
    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
    }

    const profile = await getPreferencesWithProfile();

    const { content, usedAiForOpening } = await generateCoverLetter({
      company: application.company,
      job: application.jobPosting,
      profile,
      position: application.position,
    });

    const coverLetter = await prisma.coverLetter.upsert({
      where: { applicationId },
      update: { content, status: "DRAFT" },
      create: { applicationId, content, status: "DRAFT" },
    });

    return NextResponse.json({ ...coverLetter, usedAiForOpening }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
