// -----------------------------------------------------------------------------
// GET  /api/companies       -> Liste aller Unternehmen (mit Anzahl Bewerbungen)
// POST /api/companies       -> Neues Unternehmen anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validation";
import { handleApiError, parsePagination, toPaginatedResult } from "@/lib/apiUtils";

export async function GET(request: NextRequest) {
  const pagination = parsePagination(request.nextUrl.searchParams);
  const include = { _count: { select: { applications: true, jobPostings: true } } } as const;

  // Ohne ?page=/?pageSize= bleibt die Antwort ein einfaches Array (siehe
  // Kommentar zu `parsePagination` in apiUtils.ts).
  if (!pagination) {
    const companies = await prisma.company.findMany({
      orderBy: { updatedAt: "desc" },
      include,
    });
    return NextResponse.json(companies);
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      orderBy: { updatedAt: "desc" },
      include,
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.company.count(),
  ]);

  return NextResponse.json(toPaginatedResult(companies, total, pagination));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = companySchema.parse(body);
    const company = await prisma.company.create({ data });
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
