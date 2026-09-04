// -----------------------------------------------------------------------------
// GET  /api/jobs   -> Liste aller Stellenangebote inkl. aktuellem Match-Score
// POST /api/jobs   -> Stellenangebot manuell anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { jobPostingSchema } from "@/lib/core/validation";
import { handleApiError, parsePagination, toPaginatedResult } from "@/lib/core/apiUtils";
import { computeMatchScore } from "@/lib/jobs/matching";
import { getOrCreatePreferences } from "@/lib/settings/preferences";

export async function GET(request: NextRequest) {
  try {
    const includeDismissed = request.nextUrl.searchParams.get("includeDismissed") === "true";
    const dismissedOnly = request.nextUrl.searchParams.get("dismissedOnly") === "true";

    let whereClause: { isDismissed?: boolean } = { isDismissed: false };
    if (dismissedOnly) {
      whereClause = { isDismissed: true };
    } else if (includeDismissed) {
      whereClause = {};
    }

    const [jobs, preferences] = await Promise.all([
      prisma.jobPosting.findMany({
        where: whereClause,
        orderBy: { postedAt: "desc" },
        include: { company: true, _count: { select: { applications: true } } },
      }),
      getOrCreatePreferences(),
    ]);

    // Match-Score live neu berechnen (falls sich Präferenzen geändert haben)
    const withScores = jobs.map((job) => ({
      ...job,
      matchScore: computeMatchScore({ job, preferences }),
    }));

    withScores.sort((a, b) => b.matchScore - a.matchScore);

    // Ohne ?page=/?pageSize= bleibt die Antwort ein einfaches Array (siehe
    // Kommentar zu `parsePagination` in apiUtils.ts). Die Sortierung nach
    // Match-Score wird clientseitig berechnet und muss daher vor der
    // Pagination auf der VOLLEN Liste erfolgen — Prisma-seitiges skip/take
    // wäre hier nicht korrekt.
    const pagination = parsePagination(request.nextUrl.searchParams);
    if (!pagination) {
      return NextResponse.json(withScores);
    }

    const page = withScores.slice(pagination.skip, pagination.skip + pagination.take);
    return NextResponse.json(toPaginatedResult(page, withScores.length, pagination));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, contactName, contactEmail, contactPhone, ...rest } = jobPostingSchema.parse(body);

    let companyId = rest.companyId ?? null;
    if (!companyId && companyName) {
      const existing = await prisma.company.findFirst({ where: { name: companyName } });
      if (existing) {
        // Falls neue Kontaktdaten vorliegen, aktualisieren
        if (contactName || contactEmail || contactPhone) {
          await prisma.company.update({
            where: { id: existing.id },
            data: {
              contactName: contactName || existing.contactName,
              contactEmail: contactEmail || existing.contactEmail,
              contactPhone: contactPhone || existing.contactPhone,
            },
          });
        }
        companyId = existing.id;
      } else {
        const company = await prisma.company.create({
          data: {
            name: companyName,
            contactName: contactName || null,
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
          },
        });
        companyId = company.id;
      }
    }

    const job = await prisma.jobPosting.create({
      data: { ...rest, companyId },
      include: { company: true },
    });
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
