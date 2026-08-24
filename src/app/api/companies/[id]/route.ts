// -----------------------------------------------------------------------------
// GET    /api/companies/:id  -> Unternehmen inkl. Bewerbungen & Stellenangeboten
// PATCH  /api/companies/:id  -> Unternehmen aktualisieren
// DELETE /api/companies/:id  -> Unternehmen löschen (kaskadiert auf Bewerbungen)
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { companyUpdateSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      applications: {
        orderBy: { updatedAt: "desc" },
        include: { jobPosting: true },
      },
      jobPostings: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!company) {
    return NextResponse.json({ error: "Unternehmen nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json(company);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = companyUpdateSchema.parse(body);
    const company = await prisma.company.update({ where: { id }, data });
    return NextResponse.json(company);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.company.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
