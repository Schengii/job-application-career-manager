// -----------------------------------------------------------------------------
// POST /api/applications/:id/status
// -----------------------------------------------------------------------------
// Dedizierter Endpunkt für schnelle Status-Änderungen (z.B. Dropdown in der
// Tracker-Tabelle). Schreibt Status + Status-Historie-Eintrag in einer
// Transaktion, damit das Dashboard sofort konsistente Daten sieht.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { statusEventSchema } from "@/lib/core/validation";
import { handleApiError } from "@/lib/core/apiUtils";
import { applyApplicationStatusChange } from "@/lib/applications/applicationStatus";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, note } = statusEventSchema.parse(body);

    const application = await applyApplicationStatusChange(id, status, note);

    return NextResponse.json(application);
  } catch (error) {
    return handleApiError(error);
  }
}
