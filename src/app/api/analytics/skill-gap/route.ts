// -----------------------------------------------------------------------------
// Skill Gap Analysis Route: /api/analytics/skill-gap
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { analyzeSkillGaps } from "@/lib/skillGapAnalyzer";
import { getOrCreatePreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const preferences = await getOrCreatePreferences();

    const jobs = await prisma.jobPosting.findMany({
      select: { techStack: true },
    });

    const jobTechStacks = jobs.map((j) => j.techStack);
    const analysis = analyzeSkillGaps(jobTechStacks, preferences.techStack || "");

    return NextResponse.json(analysis);
  } catch (error) {
    return handleApiError(error);
  }
}
