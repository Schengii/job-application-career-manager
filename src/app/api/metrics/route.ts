// -----------------------------------------------------------------------------
// GET /api/metrics -> Kennzahlen für die Metrik-Karten des Dashboards
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";

export async function GET() {
  // Eine gruppierte Abfrage statt sieben einzelner count()-Aufrufe: mit dem
  // Neon-HTTP-Adapter ist jede Abfrage ein eigener Netzwerk-Roundtrip.
  const [statusGroups, companies, jobs] = await Promise.all([
    prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.company.count(),
    prisma.jobPosting.count(),
  ]);

  const countFor = (status: string) => statusGroups.find((g) => g.status === status)?._count._all ?? 0;

  const draft = countFor("DRAFT");
  const sent = countFor("SENT");
  const interview = countFor("INTERVIEW");
  const offer = countFor("OFFER");
  const rejected = countFor("REJECTED");
  const withdrawn = countFor("WITHDRAWN");

  const total = statusGroups.reduce((sum, g) => sum + g._count._all, 0);
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
