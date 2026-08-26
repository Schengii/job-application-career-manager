// -----------------------------------------------------------------------------
// Job URL Scraper API Route: /api/jobs/scrape-url
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiUtils";
import { jobScrapeUrlSchema } from "@/lib/validation";
import { scrapeJobPostingUrl } from "@/lib/urlJobScraper";
import { getOrCreatePreferences } from "@/lib/preferences";
import { computeMatchScore, isCompanyExcluded } from "@/lib/matching";
import { createApiRateLimiter } from "@/lib/apiRateLimit";

export const dynamic = "force-dynamic";

// Jeder Aufruf fragt eine beliebige externe URL ab (SSRF-geprüft, siehe
// ssrfGuard.ts) — ohne Begrenzung könnte diese Route als Proxy missbraucht
// werden, um Drittanbieter-Server mit Anfragen zu fluten.
const rateLimit = createApiRateLimiter();

export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { url } = jobScrapeUrlSchema.parse(body);

    const scraped = await scrapeJobPostingUrl(url);
    const preferences = await getOrCreatePreferences();

    const isBlacklisted = isCompanyExcluded(scraped.job.companyName, preferences.excludedCompanies);
    const matchScore = computeMatchScore({ job: scraped.job, preferences });

    return NextResponse.json({
      success: true,
      scrapedJob: {
        ...scraped.job,
        matchScore: isBlacklisted ? 0 : matchScore,
        isBlacklisted,
      },
      extractedVia: scraped.extractedVia,
      warnings: scraped.warnings || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
