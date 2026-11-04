// -----------------------------------------------------------------------------
// GET  /api/snippets -> alle Anschreiben-Textbausteine (alphabetisch nach Titel)
// POST /api/snippets -> neuen Textbaustein anlegen
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { coverLetterSnippetSchema } from "@/lib/core/validation";
import { readJson, withApi } from "@/lib/core/withApi";

export const GET = withApi(async () => {
  const snippets = await prisma.coverLetterSnippet.findMany({ orderBy: { title: "asc" } });
  return NextResponse.json(snippets);
});

export const POST = withApi(async (request) => {
  const data = await readJson(request, coverLetterSnippetSchema);
  const snippet = await prisma.coverLetterSnippet.create({ data });
  return NextResponse.json(snippet, { status: 201 });
});
