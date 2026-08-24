// -----------------------------------------------------------------------------
// PATCH/DELETE /api/preferences/education/:id
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { educationEntryUpdateSchema } from "@/lib/validation";
import { handleApiError, toDateOrNull } from "@/lib/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = educationEntryUpdateSchema.parse(body);

    const entry = await prisma.educationEntry.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate !== undefined ? { startDate: toDateOrNull(data.startDate) } : {}),
        ...(data.endDate !== undefined ? { endDate: toDateOrNull(data.endDate) } : {}),
      },
    });
    return NextResponse.json(entry);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.educationEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
