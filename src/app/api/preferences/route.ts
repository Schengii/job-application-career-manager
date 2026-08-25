// -----------------------------------------------------------------------------
// GET   /api/preferences  -> Präferenzen & Profil (inkl. Ausbildung/Projekte)
// PATCH /api/preferences  -> Präferenzen aktualisieren (Upsert des Singletons)
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { preferencesSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";
import { getPreferencesWithProfile, toPublicPreferences } from "@/lib/preferences";

export async function GET() {
  const preferences = await getPreferencesWithProfile();
  return NextResponse.json(toPublicPreferences(preferences));
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data = preferencesSchema.parse(body);

    // Sicherheit: Der API-Key wird nur überschrieben, wenn das Feld explizit
    // im Request-Body enthalten ist. Ein leerer String ("") entfernt den Key
    // bewusst (z. B. über den "Key entfernen"-Button im Frontend); fehlt das
    // Feld komplett, bleibt der zuvor gespeicherte Key unverändert, damit das
    // Frontend den echten Key niemals zurückgeschickt bekommen und erneut
    // mitsenden muss (siehe `toPublicPreferences`).
    const updateData = { ...data };
    if ("aiApiKey" in updateData) {
      updateData.aiApiKey = updateData.aiApiKey?.trim() ? updateData.aiApiKey.trim() : null;
    }

    const preferences = await prisma.preferences.upsert({
      where: { id: "default" },
      update: updateData,
      create: { id: "default", ...updateData },
      include: {
        educationEntries: { orderBy: { sortOrder: "asc" } },
        projectEntries: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(toPublicPreferences(preferences));
  } catch (error) {
    return handleApiError(error);
  }
}
