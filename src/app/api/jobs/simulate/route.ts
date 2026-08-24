// -----------------------------------------------------------------------------
// POST /api/jobs/simulate
// -----------------------------------------------------------------------------
// Simuliert einen Durchlauf der angebundenen Jobportale (Stepstone, Indeed,
// GetInIT, Agentur für Arbeit): erzeugt neue, realistische Stellenangebote,
// legt bei Bedarf die zugehörigen Unternehmen an und berechnet direkt den
// Match-Score anhand der hinterlegten Präferenzen.
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { generateSimulatedJobPostings } from "@/lib/mockJobPortals";
import { computeMatchScore } from "@/lib/matching";
import { getOrCreatePreferences } from "@/lib/preferences";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const count = typeof body.count === "number" ? Math.min(30, Math.max(1, body.count)) : 10;
    const portal = typeof body.portal === "string" ? body.portal : undefined;

    const preferences = await getOrCreatePreferences();
    const simulated = generateSimulatedJobPostings(count, portal);

    const created = [];
    for (const item of simulated) {
      const { companyName, ...jobData } = item;
      let company = await prisma.company.findFirst({ where: { name: companyName } });
      if (!company) {
        company = await prisma.company.create({
          data: { name: companyName, city: jobData.location, status: "LEAD" },
        });
      }

      const matchScore = computeMatchScore({ job: jobData, preferences });

      const job = await prisma.jobPosting.create({
        data: { ...jobData, companyId: company.id, matchScore },
        include: { company: true },
      });
      created.push(job);
    }

    created.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
