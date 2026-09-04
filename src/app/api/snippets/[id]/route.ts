// -----------------------------------------------------------------------------
// PATCH/DELETE /api/snippets/:id
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { coverLetterSnippetUpdateSchema } from "@/lib/core/validation";
import { handleApiError } from "@/lib/core/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = coverLetterSnippetUpdateSchema.parse(body);
    const snippet = await prisma.coverLetterSnippet.update({ where: { id }, data });
    return NextResponse.json(snippet);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.coverLetterSnippet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
