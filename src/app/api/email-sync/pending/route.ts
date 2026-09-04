// -----------------------------------------------------------------------------
// E-Mail-Antworten-Inbox: /api/email-sync/pending
// -----------------------------------------------------------------------------
// Zentrale Übersicht ALLER offenen (PENDING) Status-Vorschläge über alle
// Bewerbungen hinweg, die POST /api/email-sync beim letzten Sync erkannt und
// persistiert hat (siehe prisma.EmailSuggestion). Ermöglicht das Annehmen/
// Ablehnen eines Vorschlags per Klick, ohne die einzelne Bewerbung öffnen zu
// müssen (bisher nur über den EmailResponseModal pro Bewerbung möglich).
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";
import { emailSuggestionActionSchema } from "@/lib/core/validation";
import { applyApplicationStatusChange } from "@/lib/applications/applicationStatus";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const suggestions = await prisma.emailSuggestion.findMany({
      where: { status: "PENDING" },
      include: {
        application: {
          include: { company: true, jobPosting: true },
        },
      },
      orderBy: [{ confidence: "desc" }, { emailDate: "desc" }],
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    return handleApiError(error);
  }
}

// Annehmen ("ACCEPT" → übernimmt suggestedStatus in die Bewerbung, per
// applyApplicationStatusChange() — dieselbe Logik wie
// POST /api/applications/:id/status) oder Ablehnen ("REJECT" → verwirft den
// Vorschlag ohne Änderung an der Bewerbung) eines einzelnen Vorschlags.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { suggestionId, action } = emailSuggestionActionSchema.parse(body);

    const suggestion = await prisma.emailSuggestion.findUnique({ where: { id: suggestionId } });
    if (!suggestion) {
      return NextResponse.json({ error: "Vorschlag nicht gefunden" }, { status: 404 });
    }
    if (suggestion.status !== "PENDING") {
      return NextResponse.json({ error: "Vorschlag wurde bereits bearbeitet" }, { status: 409 });
    }

    if (action === "ACCEPT") {
      if (!suggestion.suggestedStatus) {
        return NextResponse.json({ error: "Vorschlag enthält keinen Status-Vorschlag" }, { status: 400 });
      }
      await applyApplicationStatusChange(
        suggestion.applicationId,
        suggestion.suggestedStatus,
        `Automatisch übernommen aus der E-Mail-Antworten-Inbox (${suggestion.statusLabel})`
      );
    }

    const updated = await prisma.emailSuggestion.update({
      where: { id: suggestionId },
      data: { status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED", resolvedAt: new Date() },
    });

    return NextResponse.json({ success: true, suggestion: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
