// -----------------------------------------------------------------------------
// PATCH/DELETE /api/snippets/:id
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { coverLetterSnippetUpdateSchema } from "@/lib/core/validation";
import { readJson, withApi } from "@/lib/core/withApi";

export const PATCH = withApi<{ id: string }>(async (request, { params }) => {
  const { id } = await params;
  const data = await readJson(request, coverLetterSnippetUpdateSchema);
  const snippet = await prisma.coverLetterSnippet.update({ where: { id }, data });
  return NextResponse.json(snippet);
});

export const DELETE = withApi<{ id: string }>(async (_request, { params }) => {
  const { id } = await params;
  await prisma.coverLetterSnippet.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
