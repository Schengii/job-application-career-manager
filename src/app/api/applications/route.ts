// -----------------------------------------------------------------------------
// GET  /api/applications  -> Liste aller Bewerbungen (Tracker-Ansicht)
// POST /api/applications  -> Neue Bewerbung anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applicationSchema } from "@/lib/validation";
import { handleApiError, parsePagination, toDateOrNull, toPaginatedResult } from "@/lib/apiUtils";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const where = status ? { status } : undefined;
  const pagination = parsePagination(request.nextUrl.searchParams);

  const include = {
    company: true,
    jobPosting: true,
    coverLetter: true,
    _count: { select: { statusEvents: true, documents: true } },
  } as const;

  // Ohne ?page=/?pageSize= bleibt die Antwort ein einfaches Array (siehe
  // Kommentar zu `parsePagination` in apiUtils.ts) — das ist der Pfad, den
  // alle bestehenden Frontend-Views (Dashboard, Kanban, Excel-Grid, ...)
  // weiterhin nutzen.
  if (!pagination) {
    const applications = await prisma.application.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include,
    });
    return NextResponse.json(applications);
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include,
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.application.count({ where }),
  ]);

  return NextResponse.json(toPaginatedResult(applications, total, pagination));
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
