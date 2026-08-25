// -----------------------------------------------------------------------------
// GET  /api/jobs   -> Liste aller Stellenangebote inkl. aktuellem Match-Score
// POST /api/jobs   -> Stellenangebot manuell anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jobPostingSchema } from "@/lib/validation";
import { handleApiError, parsePagination, toPaginatedResult } from "@/lib/apiUtils";
import { computeMatchScore } from "@/lib/matching";
import { getOrCreatePreferences } from "@/lib/preferences";

export async function GET(request: NextRequest) {
  const [jobs, preferences] = await Promise.all([
    prisma.jobPosting.findMany({
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, ...rest } = jobPostingSchema.parse(body);

    let companyId = rest.companyId ?? null;
    if (!companyId && companyName) {
      const existing = await prisma.company.findFirst({ where: { name: companyName } });
      const company = existing ?? (await prisma.company.create({ data: { name: companyName } }));
      companyId = company.id;
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
