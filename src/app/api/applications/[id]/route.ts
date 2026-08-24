// -----------------------------------------------------------------------------
// GET/PATCH/DELETE /api/applications/:id  -> Detailansicht mit voller Historie
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applicationUpdateSchema } from "@/lib/validation";
import { handleApiError, toDateOrNull } from "@/lib/apiUtils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      company: true,
      jobPosting: true,
      coverLetter: true,
      statusEvents: { orderBy: { changedAt: "desc" } },
      documents: { include: { document: true } },
    },
  });
  if (!application) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json(application);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = applicationUpdateSchema.parse(body);

    const current = await prisma.application.findUniqueOrThrow({ where: { id } });
    const statusChanged = data.status !== undefined && data.status !== current.status;

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...(data.position !== undefined ? { position: data.position } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.applicationDate !== undefined ? { applicationDate: toDateOrNull(data.applicationDate) } : {}),
        ...(data.nextStep !== undefined ? { nextStep: data.nextStep } : {}),
        ...(data.nextStepDate !== undefined ? { nextStepDate: toDateOrNull(data.nextStepDate) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.source !== undefined ? { source: data.source } : {}),
        ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
        ...(data.jobPostingId !== undefined ? { jobPostingId: data.jobPostingId || null } : {}),
        ...(statusChanged
          ? { statusEvents: { create: { status: data.status!, note: "Status aktualisiert" } } }
          : {}),
      },
      include: { company: true, jobPosting: true, statusEvents: true, coverLetter: true },
    });

    return NextResponse.json(application);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.application.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
