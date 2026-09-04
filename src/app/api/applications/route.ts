// -----------------------------------------------------------------------------
// GET  /api/applications  -> Liste aller Bewerbungen (Tracker-Ansicht)
// POST /api/applications  -> Neue Bewerbung anlegen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { applicationSchema } from "@/lib/core/validation";
import { handleApiError, parsePagination, toDateOrNull, toPaginatedResult } from "@/lib/core/apiUtils";
import { buildApplicationOrderBy, buildApplicationWhere, parseApplicationQueryParams } from "@/lib/applications/applicationQuery";

const include = {
  company: true,
  jobPosting: true,
  coverLetter: true,
  // Nur die letzten 3 Status-Events (neueste zuerst) — für die
  // Benachrichtigungs-Zentrale (src/lib/notifications.ts), die daraus
  // Absage-/Zusage-/Interview-Benachrichtigungen ableitet.
  statusEvents: {
    orderBy: { changedAt: "desc" as const },
    take: 3,
    select: { id: true, status: true, changedAt: true },
  },
  _count: { select: { statusEvents: true, documents: true } },
} as const;

export async function GET(request: NextRequest) {
  const pagination = parsePagination(request.nextUrl.searchParams);

  // Ohne ?page=/?pageSize= bleibt die Antwort ein einfaches Array (siehe
  // Kommentar zu `parsePagination` in apiUtils.ts) — das ist der Pfad, den
  // Kanban-Board, Dashboard-Metriken & Notification-Bell weiterhin nutzen,
  // unverändert nur mit `?status`-Filter (kein Portal-/Tag-/Volltext-/
  // Follow-up-Filter oder Sortierung im unpaginierten Modus).
  if (!pagination) {
    const status = request.nextUrl.searchParams.get("status");
    const applications = await prisma.application.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
      include,
    });
    return NextResponse.json(applications);
  }

  // Paginierter Modus (Tabellen-/Excel-Ansicht, s. src/lib/applicationQuery.ts):
  // Filterung & Sortierung laufen serverseitig, damit sie sich nicht mit der
  // Pagination widersprechen — ein client-seitiger Filter auf nur einer
  // geladenen Seite würde sonst Treffer auf anderen Seiten verstecken.
  const queryParams = parseApplicationQueryParams(request.nextUrl.searchParams);
  const where = buildApplicationWhere(queryParams);
  const orderBy = buildApplicationOrderBy(queryParams.sortBy);

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy,
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
