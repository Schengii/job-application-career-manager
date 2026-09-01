// -----------------------------------------------------------------------------
// E-Mail-Antworten-Verlauf: /api/email-sync/history
// -----------------------------------------------------------------------------
// Liefert bereits bearbeitete (ACCEPTED/REJECTED) Status-Vorschläge, damit sich
// nachvollziehen lässt, was die Sync-Heuristik (siehe emailResponseParser.ts)
// vorgeschlagen hat und wie damit umgegangen wurde — im Gegensatz zu
// GET /api/email-sync/pending, das nur offene (PENDING) Vorschläge liefert.
// Neueste zuerst, standardmäßig auf 50 Einträge begrenzt (?limit=).
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(req: NextRequest) {
  try {
    const limitParam = req.nextUrl.searchParams.get("limit");
    const parsedLimit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(Math.trunc(parsedLimit), MAX_LIMIT)
        : DEFAULT_LIMIT;

    const suggestions = await prisma.emailSuggestion.findMany({
      where: { status: { in: ["ACCEPTED", "REJECTED"] } },
      include: {
        application: {
          include: { company: true, jobPosting: true },
        },
      },
      orderBy: [{ resolvedAt: "desc" }, { emailDate: "desc" }],
      take: limit,
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    return handleApiError(error);
  }
}
