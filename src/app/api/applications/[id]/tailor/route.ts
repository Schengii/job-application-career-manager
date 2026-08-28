// -----------------------------------------------------------------------------
// GET / POST /api/applications/[id]/tailor -> KI Requirement-Matching & Pitch-Tailoring
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { analyzeAndTailorRequirements } from "@/lib/requirementTailoring";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        company: true,
        jobPosting: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
    }

    const preferences = await prisma.preferences.findUnique({
      where: { id: "default" },
      include: {
        projectEntries: true,
        educationEntries: true,
      },
    });

    const jobInput = {
      title: application.jobPosting?.title || application.position,
      description: application.jobPosting?.description || application.notes,
      requirementsProfile: application.jobPosting?.requirementsProfile,
      techStack: application.jobPosting?.techStack,
    };

    const profileInput = {
      fullName: preferences?.fullName,
      desiredRole: preferences?.desiredRole,
      techStack: preferences?.techStack || "TypeScript, JavaScript, React, CSS3",
      profileSummary: preferences?.profileSummary,
      projects: preferences?.projectEntries.map((p) => ({
        title: p.title,
        description: p.description,
        techStack: p.techStack,
      })),
      educations: preferences?.educationEntries.map((e) => ({
        title: e.title,
        institution: e.institution,
      })),
    };

    const tailoringResult = analyzeAndTailorRequirements(jobInput, profileInput);

    return NextResponse.json(tailoringResult, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
