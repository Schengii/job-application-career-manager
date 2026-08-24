// -----------------------------------------------------------------------------
// POST /api/jobs/:id/apply
// -----------------------------------------------------------------------------
// Der "Bewerben"-Button auf einem Stellenangebot: legt (falls noch nicht
// vorhanden) eine Bewerbung im Status "DRAFT" an, verknüpft Unternehmen &
// Stelle und protokolliert das direkt als ersten Status-Event.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const job = await prisma.jobPosting.findUnique({ where: { id }, include: { company: true } });
    if (!job) return NextResponse.json({ error: "Stellenangebot nicht gefunden" }, { status: 404 });

    let companyId = job.companyId;
    if (!companyId) {
      const company = await prisma.company.create({ data: { name: "Unbekanntes Unternehmen" } });
      companyId = company.id;
    }

    const existing = await prisma.application.findFirst({
      where: { jobPostingId: job.id },
    });
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const application = await prisma.application.create({
      data: {
        position: job.title,
        status: "DRAFT",
        companyId,
        jobPostingId: job.id,
        source: job.portalSource,
        statusEvents: { create: { status: "DRAFT", note: "Bewerbung aus Stellenangebot erstellt" } },
      },
      include: { company: true, jobPosting: true, statusEvents: true },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
