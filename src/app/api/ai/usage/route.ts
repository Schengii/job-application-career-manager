// -----------------------------------------------------------------------------
// GET /api/ai/usage    -> aggregierte KI-Kosten-/Token-Statistik
// DELETE /api/ai/usage -> Statistik zurücksetzen
// -----------------------------------------------------------------------------
// Liefert src/lib/aiUsageTracker.ts's Aggregation für die Anzeige in
// Einstellungen -> Profil & Präferenzen (AiUsageCard). Rein lesend/
// löschend, kein Zod-Body nötig — keine Eingabedaten außer der Methode.
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiUtils";
import { getAiUsageSummary, clearAiUsage } from "@/lib/aiUsageTracker";

export async function GET() {
  try {
    return NextResponse.json(getAiUsageSummary());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    clearAiUsage();
    return NextResponse.json(getAiUsageSummary());
  } catch (error) {
    return handleApiError(error);
  }
}
