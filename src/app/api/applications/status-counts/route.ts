// -----------------------------------------------------------------------------
// GET /api/applications/status-counts -> Trefferzahl pro Status unter den
// AKTUELL aktiven Portal-/Such-/Follow-up-Filtern (Status selbst ausgenommen)
// -----------------------------------------------------------------------------
// Facet-Counts für die Status-Auswahl in der Excel-Tabellenansicht
// (src/components/excel/excel-grid-table.tsx): dort wird pro Seite nur ein
// Ausschnitt der Bewerbungen geladen (siehe applicationQuery.ts), ein
// clientseitiges `rows.filter(...)` für die Zähler in den Dropdown-Optionen
// würde daher nur die geladene Seite zählen, nicht den echten Gesamtwert.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import {
  buildApplicationWhere,
  parseApplicationQueryParams,
  type ApplicationStatusCounts,
} from "@/lib/applicationQuery";
import { APPLICATION_STATUS_VALUES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    // `status` wird aus den Query-Params bewusst ignoriert: die Zählung soll
    // JEDEN Status unter den übrigen aktiven Filtern zeigen (klassische
    // Facet-Counts) — sonst würde nach Auswahl eines Status in den anderen
    // Dropdown-Optionen sofort 0 angezeigt, sobald der wechselseitige
    // Status-Filter selbst mit in die Zählung einginge.
    const queryParams = parseApplicationQueryParams(request.nextUrl.searchParams);
    const where = buildApplicationWhere({ ...queryParams, status: null });

    const [total, grouped] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.groupBy({ by: ["status"], where, _count: { _all: true } }),
    ]);

    const byStatus: Record<string, number> = Object.fromEntries(APPLICATION_STATUS_VALUES.map((s) => [s, 0] as const));
    for (const row of grouped) {
      byStatus[row.status] = row._count._all;
    }

    const result: ApplicationStatusCounts = { total, byStatus };
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
