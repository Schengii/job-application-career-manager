// -----------------------------------------------------------------------------
// POST /api/applications/[id]/snooze
// -----------------------------------------------------------------------------
// Verschiebt den nächsten Handlungsschritt / die Wiedervorlage (nextStepDate)
// um N Tage (z. B. 3, 7, 14 Tage) und dokumentiert dies in der Historie.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";

const snoozeSchema = z.object({
  days: z.number().int().min(1).max(90).optional(),
  targetDate: z.string().datetime().optional(),
  note: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { days, targetDate, note } = snoozeSchema.parse(body);

    let nextDate: Date;
    if (targetDate) {
      nextDate = new Date(targetDate);
    } else {
      const addDays = days || 7;
      nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + addDays);
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
    }

    const dateFormatted = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(nextDate);

    // Update Application and create Interaction log
    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id },
        data: { nextStepDate: nextDate },
      }),
      prisma.applicationInteraction.create({
        data: {
          applicationId: id,
          type: "NOTE",
          title: `Wiedervorlage verschoben (${days ? `+${days} Tage` : "Individuell"})`,
          summary: note || `Nächster Schritt / Nachfassen verschoben auf den ${dateFormatted}.`,
          interactionDate: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      nextStepDate: updatedApp.nextStepDate,
      message: `Wiedervorlage auf den ${dateFormatted} verschoben.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
