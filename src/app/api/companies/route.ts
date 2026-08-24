// -----------------------------------------------------------------------------
// GET  /api/companies       -> Liste aller Unternehmen (mit Anzahl Bewerbungen)
// POST /api/companies       -> Neues Unternehmen anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";

export async function GET() {
  const companies = await prisma.company.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { applications: true, jobPostings: true } },
    },
  });
  return NextResponse.json(companies);
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
