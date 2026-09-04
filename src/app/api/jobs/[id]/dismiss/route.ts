// -----------------------------------------------------------------------------
// POST /api/jobs/:id/dismiss
// -----------------------------------------------------------------------------
// Blendet ein unpassendes Stellenangebot aus, speichert optional den Grund
// und aktualisiert bei Bedarf die Ausschluss-Präferenzen (Firmen-Blacklist,
// negative Keywords, unerwünschte Technologien).
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { jobDismissSchema } from "@/lib/core/validation";
import { handleApiError } from "@/lib/core/apiUtils";
import { getOrCreatePreferences } from "@/lib/settings/preferences";
import { toKeywordList } from "@/lib/jobs/matching";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason, blacklistCompany, excludeKeywords, excludeTech } = jobDismissSchema.parse(body);

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Stellenangebot nicht gefunden" }, { status: 404 });
    }

    // 1) Job als ausgeblendet markieren
    const updatedJob = await prisma.jobPosting.update({
      where: { id },
      data: {
        isDismissed: true,
        dismissReason: reason || "OTHER",
        dismissedAt: new Date(),
      },
      include: { company: true },
    });

    // 2) Präferenzen & Blacklist aktualisieren (Lerneffekt)
    const preferences = await getOrCreatePreferences();
    const updateData: {
      excludedCompanies?: string;
      excludedKeywords?: string;
      excludedTechStack?: string;
    } = {};

    let hasPrefUpdates = false;

    // Firmen-Blacklist
    if (blacklistCompany && job.company?.name) {
      const currentCompanies = toKeywordList(preferences.excludedCompanies);
      const companyLower = job.company.name.trim().toLowerCase();
      if (!currentCompanies.includes(companyLower)) {
        currentCompanies.push(job.company.name.trim());
        updateData.excludedCompanies = currentCompanies.join(",");
        hasPrefUpdates = true;
      }

      // Alle weiteren Jobs dieses Unternehmens ebenfalls automatisch ausblenden
      await prisma.jobPosting.updateMany({
        where: {
          companyId: job.companyId,
          isDismissed: false,
        },
        data: {
          isDismissed: true,
          dismissReason: "UNWANTED_COMPANY",
          dismissedAt: new Date(),
        },
      });
    }

    // Negative Keywords
    if (excludeKeywords && excludeKeywords.length > 0) {
      const currentKeywords = toKeywordList(preferences.excludedKeywords);
      for (const kw of excludeKeywords) {
        const clean = kw.trim().toLowerCase();
        if (clean && !currentKeywords.includes(clean)) {
          currentKeywords.push(clean);
          hasPrefUpdates = true;
        }
      }
      if (hasPrefUpdates) {
        updateData.excludedKeywords = currentKeywords.join(",");
      }
    }

    // Unerwünschte Technologien
    if (excludeTech && excludeTech.length > 0) {
      const currentTech = toKeywordList(preferences.excludedTechStack);
      for (const t of excludeTech) {
        const clean = t.trim().toLowerCase();
        if (clean && !currentTech.includes(clean)) {
          currentTech.push(clean);
          hasPrefUpdates = true;
        }
      }
      if (hasPrefUpdates) {
        updateData.excludedTechStack = currentTech.join(",");
      }
    }

    if (hasPrefUpdates) {
      await prisma.preferences.update({
        where: { id: "default" },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      preferencesUpdated: hasPrefUpdates,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
