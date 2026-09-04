// -----------------------------------------------------------------------------
// POST /api/applications/simulate-batch -> Erstellt automatisch Beispiel-Bewerbungen
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { generateSampleApplications } from "@/lib/core/sampleGenerator";
import { handleApiError } from "@/lib/core/apiUtils";

export async function POST() {
  try {
    const created = await generateSampleApplications(6);
    return NextResponse.json({
      success: true,
      count: created.length,
      message: `${created.length} Beispiel-Bewerbungen für Statistiken und Analytics erfolgreich angelegt.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
