// -----------------------------------------------------------------------------
// POST /api/applications/:id/status
// -----------------------------------------------------------------------------
// Dedizierter Endpunkt für schnelle Status-Änderungen (z.B. Dropdown in der
// Tracker-Tabelle). Schreibt Status + Status-Historie-Eintrag in einer
// Transaktion, damit das Dashboard sofort konsistente Daten sieht.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { statusEventSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";
import { sendDueNotifications } from "@/lib/pushNotifications";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, note } = statusEventSchema.parse(body);

    const application = await prisma.application.update({
      where: { id },
      data: {
        status,
        statusEvents: { create: { status, note: note ?? null } },
      },
      include: { company: true, jobPosting: true, statusEvents: { orderBy: { changedAt: "desc" } } },
    });

    // Fire-and-forget: verschickt u.a. Web-Push für Absage/Zusage/Interview
    // (siehe src/lib/pushNotifications.ts). Bewusst NICHT awaited — ein
    // langsamer oder fehlschlagender Push-Versand darf die Response dieser
    // Route weder verzögern noch die erfolgreiche Statusänderung selbst zum
    // Scheitern bringen (sendDueNotifications() ist ohnehin nie werfend).
    void sendDueNotifications();

    return NextResponse.json(application);
  } catch (error) {
    return handleApiError(error);
  }
}
