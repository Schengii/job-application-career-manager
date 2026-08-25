// -----------------------------------------------------------------------------
// JSON Resume Standard API Route: /api/resume/json
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { exportToJsonResume, parseJsonResumeImport, JsonResumeSchema } from "@/lib/jsonResume";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const preferences = await prisma.preferences.findUnique({
      where: { id: "default" },
      include: {
        educationEntries: { orderBy: { sortOrder: "asc" } },
        projectEntries: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!preferences) {
      return NextResponse.json({ error: "Keine Präferenzen gefunden" }, { status: 404 });
    }

    const jsonResume = exportToJsonResume(preferences);

    return NextResponse.json(jsonResume, {
      headers: {
        "Content-Disposition": `attachment; filename="resume-${(preferences.fullName || "bewerber").toLowerCase().replace(/\s+/g, "_")}.json"`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const jsonBody = (await req.json()) as JsonResumeSchema;
    const { preferences: prefData, education, projects } = parseJsonResumeImport(jsonBody);

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Preferences aktualisieren
      await tx.preferences.upsert({
        where: { id: "default" },
        update: {
          fullName: prefData.fullName,
          email: prefData.email,
          phone: prefData.phone,
          street: prefData.street,
          postalCode: prefData.postalCode,
          city: prefData.city,
          desiredRole: prefData.desiredRole,
          profileSummary: prefData.profileSummary,
          techStack: prefData.techStack,
        },
        create: {
          id: "default",
          fullName: prefData.fullName,
          email: prefData.email,
          phone: prefData.phone,
          street: prefData.street,
          postalCode: prefData.postalCode,
          city: prefData.city,
          desiredRole: prefData.desiredRole || "Fachinformatiker für Anwendungsentwicklung",
          profileSummary: prefData.profileSummary,
          techStack: prefData.techStack || "TypeScript,React,Next.js",
        },
      });

      // 2. Bildungs- und Projekt-Einträge ergänzen
      if (education.length > 0) {
        await tx.educationEntry.createMany({
          data: education.map((e, idx) => ({
            type: e.type,
            title: e.title,
            institution: e.institution,
            description: e.description,
            startDate: e.startDate,
            endDate: e.endDate,
            sortOrder: idx,
            preferencesId: "default",
          })),
        });
      }

      if (projects.length > 0) {
        await tx.projectEntry.createMany({
          data: projects.map((p, idx) => ({
            title: p.title,
            description: p.description,
            techStack: p.techStack,
            url: p.url,
            role: p.role,
            sortOrder: idx,
            preferencesId: "default",
          })),
        });
      }

      return tx.preferences.findUnique({
        where: { id: "default" },
        include: {
          educationEntries: { orderBy: { sortOrder: "asc" } },
          projectEntries: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return NextResponse.json({
      success: true,
      preferences: updated,
      message: "JSON-Resume erfolgreich importiert!",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
