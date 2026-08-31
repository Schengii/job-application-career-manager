// -----------------------------------------------------------------------------
// GET  /api/snippets -> alle Anschreiben-Textbausteine (alphabetisch nach Titel)
// POST /api/snippets -> neuen Textbaustein anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { coverLetterSnippetSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";

export async function GET() {
  const snippets = await prisma.coverLetterSnippet.findMany({ orderBy: { title: "asc" } });
  return NextResponse.json(snippets);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = coverLetterSnippetSchema.parse(body);
    const snippet = await prisma.coverLetterSnippet.create({ data });
    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
