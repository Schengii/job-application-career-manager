// -----------------------------------------------------------------------------
// POST /api/preferences/projects -> Neuen Projekt-/Referenzeintrag anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectEntrySchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";
import { getOrCreatePreferences } from "@/lib/preferences";

export async function POST(request: NextRequest) {
  try {
    await getOrCreatePreferences();
    const body = await request.json();
    const data = projectEntrySchema.parse(body);
    const entry = await prisma.projectEntry.create({ data: { ...data, preferencesId: "default" } });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
