// -----------------------------------------------------------------------------
// API-Route für individuelles Profil: /api/profiles/[id]
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.careerProfile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Aktiviert dieses Profil als aktives Standard-Profil in Preferences
  try {
    const { id } = await params;
    const profile = await prisma.careerProfile.findUnique({ where: { id } });
    if (!profile) {
      return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
    }

    // Andere ent-defaulten
    await prisma.careerProfile.updateMany({
      where: { preferencesId: "default" },
      data: { isDefault: false },
    });

    await prisma.careerProfile.update({
      where: { id },
      data: { isDefault: true },
    });

    // Hauptpräferenzen mit Werten dieses Profils synchronisieren
    await prisma.preferences.update({
      where: { id: "default" },
      data: {
        desiredRole: profile.desiredRole,
        techStack: profile.techStack,
        preferredLocations: profile.preferredLocations || "Bonn,Dortmund,Remote",
        minSalary: profile.minSalary,
        remotePreference: profile.remotePreference,
        profileSummary: profile.profileSummary,
        standardCoverLetterBody: profile.standardCoverLetterBody,
      },
    });

    return NextResponse.json({ success: true, message: `Profil "${profile.name}" aktiviert!` });
  } catch (error) {
    return handleApiError(error);
  }
}
