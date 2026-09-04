// -----------------------------------------------------------------------------
// GET  /api/companies       -> Liste aller Unternehmen (mit Anzahl Bewerbungen)
// POST /api/companies       -> Neues Unternehmen anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { companySchema } from "@/lib/core/validation";
import { handleApiError, parsePagination, toPaginatedResult } from "@/lib/core/apiUtils";
import { findCompanyDuplicates } from "@/lib/applications/companyDuplicates";

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
    const { forceCreate, ...data } = companySchema.parse(body);

    // Duplikat-Warnung statt harter Sperre: verschiedene Unternehmen können
    // legitim ähnliche Namen tragen (z.B. Filialen), daher wird bei einem
    // Treffer nur ein 200er mit den Kandidaten zurückgegeben — das Frontend
    // fragt den Nutzer und schickt bei Bestätigung erneut mit
    // `forceCreate: true`, um die Prüfung bewusst zu umgehen (siehe
    // src/lib/companyDuplicates.ts, company-form-dialog.tsx).
    if (!forceCreate) {
      const existing = await prisma.company.findMany({ select: { id: true, name: true } });
      const duplicates = findCompanyDuplicates(data.name, existing);
      if (duplicates.length > 0) {
        return NextResponse.json({ duplicateWarning: true, candidates: duplicates }, { status: 200 });
      }
    }

    const company = await prisma.company.create({ data });
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
