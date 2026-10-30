// -----------------------------------------------------------------------------
// POST /api/portfolio/view — öffentliche, token-geschützte Recruiter-Ansicht
// -----------------------------------------------------------------------------
// Body: { token, pin? }. Prüft Token/Ablauf/PIN serverseitig, zählt erfolgreiche
// Aufrufe und liefert nur die Recruiter-Felder (siehe lib/portfolio/publicView).
// Ersetzt die frühere Kombination aus /api/preferences + /api/portfolio/track,
// die die kompletten Preferences samt PIN an den Browser lieferte.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";
import { createApiRateLimiter } from "@/lib/core/apiRateLimit";
import { checkPortfolioAccess, toPublicPortfolio } from "@/lib/portfolio/publicView";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().min(1).max(128),
  pin: z.string().max(10).optional(),
});

// Bremst das Durchprobieren von PINs und Tokens (pro Server-Instanz).
const rateLimit = createApiRateLimiter();

export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const { token, pin } = bodySchema.parse(await request.json().catch(() => null));

    const prefs = await prisma.preferences.findFirst({
      where: { portfolioShareToken: token },
      include: {
        projectEntries: { orderBy: { sortOrder: "asc" } },
        educationEntries: { orderBy: { sortOrder: "asc" } },
      },
    });

    const access = checkPortfolioAccess(prefs, token, pin?.trim());
    if (access === "invalid" || !prefs) {
      return NextResponse.json({ error: "Ungültiger oder abgelaufener Link" }, { status: 404 });
    }
    if (access === "pin_required") {
      return NextResponse.json({ pinRequired: true }, { status: 401 });
    }
    if (access === "pin_wrong") {
      return NextResponse.json({ pinRequired: true, error: "Falsche PIN" }, { status: 401 });
    }

    await prisma.preferences.update({
      where: { id: prefs.id },
      data: { portfolioViewCount: { increment: 1 } },
    });

    return NextResponse.json(toPublicPortfolio(prefs));
  } catch (error) {
    return handleApiError(error);
  }
}
