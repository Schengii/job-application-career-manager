// -----------------------------------------------------------------------------
// API-Route für Multi-Profil-Verwaltung: /api/profiles
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";
import { z } from "zod";

const careerProfileSchema = z.object({
  name: z.string().min(2, "Profilname erforderlich"),
  desiredRole: z.string().min(2, "Zielrolle erforderlich"),
  techStack: z.string().min(2, "Tech-Stack erforderlich"),
  preferredLocations: z.string().optional().nullable(),
  minSalary: z.number().int().optional().nullable(),
  remotePreference: z.enum(["ONSITE", "HYBRID", "REMOTE", "ANY"]).default("HYBRID"),
  profileSummary: z.string().optional().nullable(),
  standardCoverLetterBody: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  try {
    const profiles = await prisma.careerProfile.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(profiles);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = careerProfileSchema.parse(body);

    // Falls dieses Profil als Standard markiert wird, andere ent-defaulten
    if (data.isDefault) {
      await prisma.careerProfile.updateMany({
        where: { preferencesId: "default" },
        data: { isDefault: false },
      });
    }

    const created = await prisma.careerProfile.create({
      data: {
        ...data,
        preferencesId: "default",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
