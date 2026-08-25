// -----------------------------------------------------------------------------
// GET  /api/applications  -> Liste aller Bewerbungen (Tracker-Ansicht)
// POST /api/applications  -> Neue Bewerbung anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applicationSchema } from "@/lib/validation";
import { handleApiError, toDateOrNull } from "@/lib/apiUtils";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  const applications = await prisma.application.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      company: true,
      jobPosting: true,
      coverLetter: true,
      _count: { select: { statusEvents: true, documents: true } },
    },
  });
  return NextResponse.json(applications);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = applicationSchema.parse(body);

    const application = await prisma.application.create({
      data: {
        position: data.position,
        status: data.status ?? "DRAFT",
        applicationDate: toDateOrNull(data.applicationDate) ?? null,
        nextStep: data.nextStep ?? null,
        nextStepDate: toDateOrNull(data.nextStepDate) ?? null,
        meetingUrl: data.meetingUrl ?? null,
        rejectionReason: data.rejectionReason ?? null,
        tags: data.tags ?? null,
        notes: data.notes ?? null,
        source: data.source ?? null,
        companyId: data.companyId,
        jobPostingId: data.jobPostingId || null,
        statusEvents: {
          create: { status: data.status ?? "DRAFT", note: "Bewerbung angelegt" },
        },
      },
      include: { company: true, jobPosting: true, statusEvents: true },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
