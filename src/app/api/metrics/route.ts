// -----------------------------------------------------------------------------
// GET /api/metrics -> Kennzahlen für die Metrik-Karten des Dashboards
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";

export async function GET() {
  const [total, draft, sent, interview, offer, rejected, withdrawn, companies, jobs] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: "DRAFT" } }),
    prisma.application.count({ where: { status: "SENT" } }),
    prisma.application.count({ where: { status: "INTERVIEW" } }),
    prisma.application.count({ where: { status: "OFFER" } }),
    prisma.application.count({ where: { status: "REJECTED" } }),
    prisma.application.count({ where: { status: "WITHDRAWN" } }),
    prisma.company.count(),
    prisma.jobPosting.count(),
  ]);

  const open = draft + sent + interview;

  return NextResponse.json({
    total,
    open,
    draft,
    sent,
    interview,
    offer,
    rejected,
    withdrawn,
    companies,
    jobs,
  });
}
