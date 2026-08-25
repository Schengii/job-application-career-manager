// -----------------------------------------------------------------------------
// Live Job Search API Route: /api/jobs/live-search
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiUtils";
import { jobLiveSearchSchema } from "@/lib/validation";
import { searchRealJobs } from "@/lib/realJobSearch";
import { getOrCreatePreferences } from "@/lib/preferences";
import { computeMatchScore, isCompanyExcluded } from "@/lib/matching";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = jobLiveSearchSchema.parse(body);

    const preferences = await getOrCreatePreferences();
    const searchResult = await searchRealJobs(parsed);

    // Berechne für jeden gefundenen Job den Match-Score gegen das Profil
    const scoredJobs = searchResult.jobs.map((job) => {
      const isBlacklisted = isCompanyExcluded(job.companyName, preferences.excludedCompanies);
      const matchScore = computeMatchScore({ job, preferences });

      return {
        ...job,
        matchScore: isBlacklisted ? 0 : matchScore,
        isBlacklisted,
      };
    });

    // Nach Match-Score sortieren
    scoredJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return NextResponse.json({
      success: true,
      jobs: scoredJobs,
      totalFound: searchResult.totalFound,
      sourcesQueried: searchResult.sourcesQueried,
      isFallback: searchResult.isFallback,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
