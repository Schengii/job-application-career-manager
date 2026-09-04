// -----------------------------------------------------------------------------
// Multi-Portal Sync Route: /api/jobs/sync
// -----------------------------------------------------------------------------
// Synchronisiert automatisch Stellenanzeigen über alle angebundenen Jobportale
// (StepStone, Indeed, Get in IT, LinkedIn, Xing, Bundesagentur für Arbeit,
// Monster, Honeypot), prüft Duplikate und berechnet individuelle Match-Scores.
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";
import { generateMultiPortalBatch, SUPPORTED_PORTALS } from "@/lib/jobs/mockJobPortals";
import { computeMatchScore, isCompanyExcluded } from "@/lib/jobs/matching";
import { getOrCreatePreferences } from "@/lib/settings/preferences";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const preferences = await getOrCreatePreferences();
    const batch = generateMultiPortalBatch(2); // 2 pro Portal = 16 Angebote

    // Performance: Statt pro Job-Item sequenziell einzeln nach dem
    // Unternehmen zu suchen (N Roundtrips), werden zunächst alle
    // beteiligten Firmennamen in einer einzigen Abfrage geladen. Fehlende
    // Firmen werden danach gebündelt per `createMany` angelegt (1 weiterer
    // Roundtrip statt bis zu N).
    const companyNames = [...new Set(batch.map((item) => item.companyName))];
    const existingCompanies = await prisma.company.findMany({
      where: { name: { in: companyNames } },
    });
    const companyIdByName = new Map(existingCompanies.map((c) => [c.name, c.id] as const));

    const missingCompanyNames = companyNames.filter((name) => !companyIdByName.has(name));
    if (missingCompanyNames.length > 0) {
      const firstLocationByName = new Map(batch.map((item) => [item.companyName, item.location] as const));
      await prisma.company.createMany({
        data: missingCompanyNames.map((name) => ({
          name,
          city: firstLocationByName.get(name),
          status: "LEAD",
        })),
      });
      const newlyCreated = await prisma.company.findMany({
        where: { name: { in: missingCompanyNames } },
      });
      for (const company of newlyCreated) {
        companyIdByName.set(company.name, company.id);
      }
    }

    // Duplikate (gleicher Titel + gleiche Firma) ebenfalls in einer einzigen
    // Abfrage ausschließen, statt pro Item einzeln nachzufragen.
    const candidateCompanyIds = [...companyIdByName.values()];
    const existingJobs = await prisma.jobPosting.findMany({
      where: { companyId: { in: candidateCompanyIds } },
      select: { title: true, companyId: true },
    });
    const existingJobKeys = new Set(existingJobs.map((j) => `${j.companyId}::${j.title}`));

    // Dedupliziert sowohl gegen bereits in der DB vorhandene Jobs als auch
    // gegen Duplikate INNERHALB desselben Batches (der Key-Set wird beim
    // Durchlaufen live erweitert).
    type JobData = Omit<(typeof batch)[number], "companyName">;
    const toCreate: { jobData: JobData; companyId: string }[] = [];
    for (const { companyName, ...jobData } of batch) {
      const companyId = companyIdByName.get(companyName);
      if (!companyId) continue;

      const key = `${companyId}::${jobData.title}`;
      if (existingJobKeys.has(key)) continue;

      existingJobKeys.add(key);
      toCreate.push({ jobData, companyId });
    }

    let createdCount = 0;
    const createdJobs = [];
    for (const { jobData, companyId } of toCreate) {
      const company = existingCompanies.find((c) => c.id === companyId);
      const isBlacklisted = isCompanyExcluded(company?.name, preferences.excludedCompanies);
      const matchScore = computeMatchScore({ job: jobData, preferences });

      const job = await prisma.jobPosting.create({
        data: {
          ...jobData,
          companyId,
          matchScore,
          isDismissed: isBlacklisted,
          dismissReason: isBlacklisted ? "UNWANTED_COMPANY" : null,
          dismissedAt: isBlacklisted ? new Date() : null,
        },
        include: { company: true },
      });
      createdJobs.push(job);
      createdCount++;
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
