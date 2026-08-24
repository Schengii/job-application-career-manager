// -----------------------------------------------------------------------------
// GET   /api/preferences  -> Präferenzen & Profil (inkl. Ausbildung/Projekte)
// PATCH /api/preferences  -> Präferenzen aktualisieren (Upsert des Singletons)
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { preferencesSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";
import { getPreferencesWithProfile } from "@/lib/preferences";

export async function GET() {
  const preferences = await getPreferencesWithProfile();
  return NextResponse.json(preferences);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data = preferencesSchema.parse(body);

    const preferences = await prisma.preferences.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
      include: {
        educationEntries: { orderBy: { sortOrder: "asc" } },
        projectEntries: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    return handleApiError(error);
  }
}
