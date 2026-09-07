// -----------------------------------------------------------------------------
// Automatischer Hintergrund-Job-Crawler & Match-Alert Engine
// -----------------------------------------------------------------------------
// Führt periodisch im Scheduler-Tick eine Live-Jobsuche durch (Arbeitsagentur /
// Arbeitnow), berechnet Match-Scores anhand der Bewerber-Präferenzen und
// schlägt bei neuen Top-Treffern (z.B. >= 85%) Push-Benachrichtigungen an
// registrierte Browser an.
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/core/prisma";
import { searchRealJobs } from "@/lib/jobs/realJobSearch";
import { computeMatchScore } from "@/lib/jobs/matching";
import { sendPushToSubscription, type PushPayload } from "@/lib/settings/pushNotifications";
import type { Preferences } from "@/types";

export interface CrawlJobsResult {
  crawledCount: number;
  newJobsStored: number;
  topMatchesAlerted: number;
}

export async function runJobCrawlerTick(): Promise<CrawlJobsResult> {
  const preferences = (await prisma.preferences.findUnique({
    where: { id: "default" },
  })) as Preferences | null;

  if (!preferences) {
    return { crawledCount: 0, newJobsStored: 0, topMatchesAlerted: 0 };
  }

  // Abfrage basierend auf Wunschrolle & Ort
  const query = preferences.desiredRole || "Frontend Entwickler";
  const locations = (preferences.preferredLocations || "Bonn,Dortmund,Remote").split(",").map((s) => s.trim());
  const primaryLocation = locations[0] || "Bonn";

  const searchResult = await searchRealJobs({
    query,
    location: primaryLocation,
    limit: 15,
  });

  let newJobsStored = 0;
  let topMatchesAlerted = 0;

  for (const liveJob of searchResult.jobs) {
    // Prüfen, ob Job bereits in DB existiert (über Source-URL oder Titel+Unternehmen)
    const existing = await prisma.jobPosting.findFirst({
      where: {
        OR: [
          liveJob.sourceUrl ? { sourceUrl: liveJob.sourceUrl } : {},
          { title: liveJob.title, requirementsProfile: liveJob.companyName },
        ],
      },
    });

    if (existing) continue;

    // Match-Score ermitteln
    const techStackStr = Array.isArray(liveJob.techStack)
      ? (liveJob.techStack as string[]).join(", ")
      : String(liveJob.techStack || "");

    const score = computeMatchScore({
      job: {
        title: liveJob.title,
        description: liveJob.description,
        techStack: techStackStr,
        location: liveJob.location,
        remote: liveJob.remote,
      },
      preferences: {
        techStack: preferences.techStack,
        preferredLocations: preferences.preferredLocations,
        remotePreference: preferences.remotePreference,
        desiredRole: preferences.desiredRole,
      },
    });

    // Unternehmen anlegen oder zuordnen falls nicht vorhanden
    let company = await prisma.company.findFirst({
      where: { name: liveJob.companyName },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: liveJob.companyName,
          city: liveJob.location,
          notes: "Automatisch durch Job-Crawler erfasst",
        },
      });
    }

    const createdJob = await prisma.jobPosting.create({
      data: {
        title: liveJob.title,
        description: liveJob.description,
        portalSource: liveJob.portalSource,
        sourceUrl: liveJob.sourceUrl,
        location: liveJob.location,
        remote: liveJob.remote,
        salaryInfo: liveJob.salaryInfo,
        techStack: techStackStr,
        matchScore: score,
        companyId: company.id,
      },
    });

    newJobsStored++;

    // Push-Alert bei außergewöhnlich gutem Match (>= 85%)
    if (score >= 85) {
      const subscriptions = await prisma.pushSubscription.findMany();
      if (subscriptions.length > 0) {
        const payload: PushPayload = {
          title: `🎯 Top Job-Match (${score}%): ${liveJob.title}`,
          body: `${liveJob.companyName} (${liveJob.location || "Remote"}): Neuer passender Treffer erfasst!`,
          url: `/jobs`,
          tag: `job-alert-${createdJob.id}`,
        };

        for (const sub of subscriptions) {
          await sendPushToSubscription(sub, payload);
        }
        topMatchesAlerted++;
      }
    }
  }

  return {
    crawledCount: searchResult.jobs.length,
    newJobsStored,
    topMatchesAlerted,
  };
}
