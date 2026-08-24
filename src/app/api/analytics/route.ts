// -----------------------------------------------------------------------------
// GET /api/analytics -> aggregierte Kennzahlen für die Insights-Seite
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUSES, JOB_PORTALS } from "@/lib/constants";

const RESPONSE_STATUSES = new Set(["INTERVIEW", "OFFER", "REJECTED"]);

export async function GET() {
  const applications = await prisma.application.findMany({
    include: { statusEvents: { orderBy: { changedAt: "asc" } } },
  });

  // 1) Status-Verteilung (feste Reihenfolge wie überall sonst in der App)
  const statusDistribution = APPLICATION_STATUSES.map((s) => ({
    status: s.value,
    label: s.label,
    color: s.color,
    count: applications.filter((a) => a.status === s.value).length,
  }));

  // 2) Portal-Verteilung (Quelle der Bewerbung)
  const portalDistribution = [...JOB_PORTALS, { value: "UNKNOWN", label: "Unbekannt" }]
    .map((p) => ({
      portal: p.value,
      label: p.label,
      count: applications.filter((a) => (a.source ?? "UNKNOWN") === p.value).length,
    }))
    .filter((p) => p.count > 0);

  // 3) Bewerbungen pro Monat (letzte 6 Monate, nach Erstellungsdatum)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("de-DE", { month: "short" }) };
  });
  const monthlySeries = months.map(({ year, month, label }) => ({
    label,
    count: applications.filter((a) => {
      const d = new Date(a.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length,
  }));

  // 4) Erfolgsquote: Zusagen im Verhältnis zu abgeschlossenen Bewerbungen (Zusage/Absage)
  const offerCount = applications.filter((a) => a.status === "OFFER").length;
  const rejectedCount = applications.filter((a) => a.status === "REJECTED").length;
  const decided = offerCount + rejectedCount;
  const successRate = decided > 0 ? Math.round((offerCount / decided) * 100) : null;

  // 5) Durchschnittliche Reaktionszeit: Tage zwischen Bewerbungsdatum und der
  //    ersten Rückmeldung (Gespräch/Zusage/Absage) laut Status-Historie
  const responseDurations: number[] = [];
  for (const app of applications) {
    if (!app.applicationDate) continue;
    const firstResponse = app.statusEvents.find((e) => RESPONSE_STATUSES.has(e.status));
    if (!firstResponse) continue;
    const days = Math.round(
      (new Date(firstResponse.changedAt).getTime() - new Date(app.applicationDate).getTime()) / 86_400_000,
    );
    if (days >= 0) responseDurations.push(days);
  }
  const avgResponseDays =
    responseDurations.length > 0
      ? Math.round(responseDurations.reduce((sum, d) => sum + d, 0) / responseDurations.length)
      : null;

  return NextResponse.json({
    statusDistribution,
    portalDistribution,
    monthlySeries,
    successRate,
    avgResponseDays,
    totalApplications: applications.length,
    respondedCount: responseDurations.length,
  });
}
