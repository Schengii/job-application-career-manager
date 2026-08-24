// -----------------------------------------------------------------------------
// PATCH/DELETE /api/cover-letters/:id
// -----------------------------------------------------------------------------
// Ermöglicht manuelles Nachbearbeiten des generierten Textes sowie den
// Statuswechsel "Entwurf" -> "Gesendet".
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { coverLetterUpdateSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const data = coverLetterUpdateSchema.parse(await request.json());
    const coverLetter = await prisma.coverLetter.update({ where: { id }, data });
    return NextResponse.json(coverLetter);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.coverLetter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
