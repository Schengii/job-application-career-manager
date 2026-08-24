// -----------------------------------------------------------------------------
// Multi-Portal Sync Route: /api/jobs/sync
// -----------------------------------------------------------------------------
// Synchronisiert automatisch Stellenanzeigen über alle angebundenen Jobportale
// (StepStone, Indeed, Get in IT, LinkedIn, Xing, Bundesagentur für Arbeit,
// Monster, Honeypot), prüft Duplikate und berechnet individuelle Match-Scores.
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { generateMultiPortalBatch, SUPPORTED_PORTALS } from "@/lib/mockJobPortals";
import { computeMatchScore } from "@/lib/matching";
import { getOrCreatePreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const preferences = await getOrCreatePreferences();
    const batch = generateMultiPortalBatch(2); // 2 pro Portal = 16 Angebote

    let createdCount = 0;
    const createdJobs = [];

    for (const item of batch) {
      const { companyName, ...jobData } = item;

      // Finde oder erstelle das Unternehmen
      let company = await prisma.company.findFirst({ where: { name: companyName } });
      if (!company) {
        company = await prisma.company.create({
          data: { name: companyName, city: jobData.location, status: "LEAD" },
        });
      }

      // Prüfe auf Duplikate anhand von Titel und Unternehmen
      const existing = await prisma.jobPosting.findFirst({
        where: {
          title: jobData.title,
          companyId: company.id,
        },
      });

      if (!existing) {
        const matchScore = computeMatchScore({ job: jobData, preferences });

        const job = await prisma.jobPosting.create({
          data: {
            ...jobData,
            companyId: company.id,
            matchScore,
          },
          include: { company: true },
        });
        createdJobs.push(job);
        createdCount++;
      }
    }

    const totalJobsCount = await prisma.jobPosting.count();

    return NextResponse.json({
      success: true,
      createdCount,
      totalJobsCount,
      syncedPortalsCount: SUPPORTED_PORTALS.length,
      syncedPortals: SUPPORTED_PORTALS.map((p) => p.name),
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const totalJobsCount = await prisma.jobPosting.count();
    const latestJob = await prisma.jobPosting.findFirst({
      orderBy: { postedAt: "desc" },
    });

    return NextResponse.json({
      totalJobsCount,
      supportedPortals: SUPPORTED_PORTALS,
      lastSyncedAt: latestJob?.postedAt || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
