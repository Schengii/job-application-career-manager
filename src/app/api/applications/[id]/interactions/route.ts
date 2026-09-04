// -----------------------------------------------------------------------------
// POST /api/applications/:id/interactions   -> Neue Interaktion anlegen
// DELETE /api/applications/:id/interactions -> Interaktion löschen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { interactionSchema } from "@/lib/core/validation";
import { handleApiError, toDateOrNull } from "@/lib/core/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = interactionSchema.parse(body);

    const interaction = await prisma.applicationInteraction.create({
      data: {
        type: data.type,
        title: data.title,
        summary: data.summary ?? null,
        interactionDate: toDateOrNull(data.interactionDate) ?? new Date(),
        applicationId: id,
      },
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await params;
    const interactionId = request.nextUrl.searchParams.get("interactionId");
    if (!interactionId) {
      return NextResponse.json({ error: "interactionId ist erforderlich" }, { status: 400 });
    }

    await prisma.applicationInteraction.delete({
      where: { id: interactionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
