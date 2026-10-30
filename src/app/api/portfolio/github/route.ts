import { NextRequest, NextResponse } from "next/server";
import { createApiRateLimiter } from "@/lib/core/apiRateLimit";
import { fetchGitHubRepoDetails } from "@/lib/portfolio/githubIntegration";

// Öffentlich erreichbar (Recruiter-Ansicht) — daher gedrosselt.
const rateLimit = createApiRateLimiter();

export async function GET(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL Parameter fehlt" }, { status: 400 });
  }

  const details = await fetchGitHubRepoDetails(url);
  if (!details) {
    return NextResponse.json({ error: "Keine gültige GitHub-Repository-URL" }, { status: 400 });
  }

  return NextResponse.json(details);
}
