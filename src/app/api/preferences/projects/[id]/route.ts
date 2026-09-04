// -----------------------------------------------------------------------------
// PATCH/DELETE /api/preferences/projects/:id
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { projectEntryUpdateSchema } from "@/lib/core/validation";
import { handleApiError } from "@/lib/core/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = projectEntryUpdateSchema.parse(body);
    const entry = await prisma.projectEntry.update({ where: { id }, data });
    return NextResponse.json(entry);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.projectEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
