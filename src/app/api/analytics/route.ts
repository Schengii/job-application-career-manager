// -----------------------------------------------------------------------------
// GET /api/analytics -> aggregierte Kennzahlen für die Insights-Seite
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { APPLICATION_STATUSES, JOB_PORTALS } from "@/lib/core/constants";
import { computeTagSuccessRates, computeTechStackSuccessRates } from "@/lib/interview/skillSuccessRates";

const RESPONSE_STATUSES = new Set(["INTERVIEW", "OFFER", "REJECTED"]);

export async function GET() {
  const applications = await prisma.application.findMany({
    include: {
      statusEvents: { orderBy: { changedAt: "asc" } },
      jobPosting: { select: { techStack: true } },
    },
  });

  // 1) Status-Verteilung (feste Reihenfolge wie überall sonst in der App)
  const statusDistribution = APPLICATION_STATUSES.map((s) => ({
    status: s.value,
    label: s.label,
    color: s.color,
    count: applications.filter((a) => a.status === s.value).length,
  }));

  // 2) Portal-Verteilung (Quelle der Bewerbung)
  const portalDistribution = [...JOB_PORTALS, { value: "UNKNOWN", label: "Sonstige / Unbekannt" }]
    .map((p) => {
      const portalApps = applications.filter((a) => (a.source ?? "UNKNOWN") === p.value);
      const interviews = portalApps.filter(
        (a) => a.status === "INTERVIEW" || a.status === "OFFER" || a.statusEvents.some((e) => e.status === "INTERVIEW"),
      ).length;
      return {
        portal: p.value,
        label: p.label,
        count: portalApps.length,
        interviewCount: interviews,
        interviewRate: portalApps.length > 0 ? Math.round((interviews / portalApps.length) * 100) : 0,
      };
    })
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

  // 5) Funnel / Conversion Trichter
  const totalSent = applications.filter((a) => a.status !== "DRAFT" || a.statusEvents.length > 0).length;
  const respondedApps = applications.filter(
    (a) => RESPONSE_STATUSES.has(a.status) || a.statusEvents.some((e) => RESPONSE_STATUSES.has(e.status)),
  ).length;
  const interviewApps = applications.filter(
    (a) => a.status === "INTERVIEW" || a.status === "OFFER" || a.statusEvents.some((e) => e.status === "INTERVIEW"),
  ).length;

  const funnel = [
    { stage: "Bewerbung verschickt", count: totalSent, rate: 100 },
    { stage: "Rückmeldung erhalten", count: respondedApps, rate: totalSent > 0 ? Math.round((respondedApps / totalSent) * 100) : 0 },
    { stage: "Vorstellungsgespräch", count: interviewApps, rate: totalSent > 0 ? Math.round((interviewApps / totalSent) * 100) : 0 },
    { stage: "Job-Angebot / Zusage", count: offerCount, rate: totalSent > 0 ? Math.round((offerCount / totalSent) * 100) : 0 },
  ];

  // 6) Durchschnittliche Reaktionszeit
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

  // 7) Absagegründe-Verteilung
  const rejectionApps = applications.filter((a) => a.status === "REJECTED");
  const reasonCounts = new Map<string, number>();
  for (const app of rejectionApps) {
    const r = app.rejectionReason || "Keine Begründung angegeben";
    reasonCounts.set(r, (reasonCounts.get(r) || 0) + 1);
  }
  const rejectionDistribution = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      pct: rejectionApps.length > 0 ? Math.round((count / rejectionApps.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 8) Erfolgsquote nach Tag & nach Tech-Stack der verknüpften Stellenanzeige
  // (siehe src/lib/skillSuccessRates.ts) — hilft z. B. zu erkennen, dass
  // "#Remote"-Bewerbungen häufiger zu einem Gespräch führen als der
  // Durchschnitt, oder dass ein bestimmter Tech-Stack-Skill überdurchschnittlich
  // gut ankommt.
  const tagSuccessRates = computeTagSuccessRates(applications);
  const techStackSuccessRates = computeTechStackSuccessRates(applications);

  return NextResponse.json({
    statusDistribution,
    portalDistribution,
    monthlySeries,
    funnel,
    rejectionDistribution,
    tagSuccessRates,
    techStackSuccessRates,
    successRate,
    avgResponseDays,
    totalApplications: applications.length,
    respondedCount: responseDurations.length,
    rejectedCount: rejectionApps.length,
  });
}
