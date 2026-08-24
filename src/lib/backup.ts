// -----------------------------------------------------------------------------
// Backup & Restore Engine
// -----------------------------------------------------------------------------
// Ermöglicht den vollständigen Export und Import aller Anwendungsdaten
// (Profil, Unternehmen, Bewerbungen, Historie, Dokumenten-Metadaten) als
// portable JSON-Datei.
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/prisma";

export type BackupData = {
  version: number;
  exportedAt: string;
  preferences: unknown;
  educationEntries: unknown[];
  projectEntries: unknown[];
  companies: unknown[];
  jobPostings: unknown[];
  applications: unknown[];
  documents: unknown[];
};

export async function createFullBackup(): Promise<BackupData> {
  const [preferences, educationEntries, projectEntries, companies, jobPostings, applications, documents] =
    await Promise.all([
      prisma.preferences.findUnique({ where: { id: "default" } }),
      prisma.educationEntry.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.projectEntry.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.company.findMany(),
      prisma.jobPosting.findMany(),
      prisma.application.findMany({
        include: {
          statusEvents: true,
          coverLetter: true,
          documents: true,
        },
      }),
      prisma.document.findMany(),
    ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    preferences,
    educationEntries,
    projectEntries,
    companies,
    jobPostings,
    applications,
    documents,
  };
}

export async function restoreFromBackup(data: BackupData): Promise<{ success: boolean; stats: Record<string, number> }> {
  if (!data || typeof data !== "object" || data.version !== 1) {
    throw new Error("Ungültiges Backup-Format oder inkompatible Version.");
  }

  const stats = {
    companies: 0,
    applications: 0,
    jobPostings: 0,
    documents: 0,
    educationEntries: 0,
    projectEntries: 0,
  };

  await prisma.$transaction(async (tx) => {
    // 1. Preferences wiederherstellen
    if (data.preferences && typeof data.preferences === "object") {
      const pref = data.preferences as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, updatedAt, educationEntries: _edu, projectEntries: _proj, ...prefData } = pref;
      await tx.preferences.upsert({
        where: { id: "default" },
        update: prefData as never,
        create: { id: "default", ...prefData } as never,
      });
    }

    // 2. Education & Projects
    if (Array.isArray(data.educationEntries)) {
      await tx.educationEntry.deleteMany({ where: { preferencesId: "default" } });
      for (const edu of data.educationEntries) {
        const item = edu as Record<string, unknown>;
        await tx.educationEntry.create({
          data: {
            id: item.id as string | undefined,
            type: (item.type as string) || "WEITERBILDUNG",
            title: (item.title as string) || "Ausbildung",
            institution: item.institution as string | null,
            startDate: item.startDate ? new Date(item.startDate as string) : null,
            endDate: item.endDate ? new Date(item.endDate as string) : null,
            description: item.description as string | null,
            sortOrder: (item.sortOrder as number) || 0,
            preferencesId: "default",
          },
        });
        stats.educationEntries++;
      }
    }

    if (Array.isArray(data.projectEntries)) {
      await tx.projectEntry.deleteMany({ where: { preferencesId: "default" } });
      for (const proj of data.projectEntries) {
        const item = proj as Record<string, unknown>;
        await tx.projectEntry.create({
          data: {
            id: item.id as string | undefined,
            title: (item.title as string) || "Projekt",
            description: item.description as string | null,
            techStack: item.techStack as string | null,
            url: item.url as string | null,
            role: item.role as string | null,
            sortOrder: (item.sortOrder as number) || 0,
            preferencesId: "default",
          },
        });
        stats.projectEntries++;
      }
    }

    // 3. Documents
    if (Array.isArray(data.documents)) {
      for (const doc of data.documents) {
        const item = doc as Record<string, unknown>;
        if (item.id) {
          await tx.document.upsert({
            where: { id: item.id as string },
            update: {
              name: item.name as string,
              category: item.category as string,
              description: item.description as string | null,
              fileName: item.fileName as string | null,
              fileUrl: item.fileUrl as string | null,
              mimeType: item.mimeType as string | null,
              fileSize: item.fileSize as number | null,
            },
            create: {
              id: item.id as string,
              name: (item.name as string) || "Dokument",
              category: (item.category as string) || "SONSTIGES",
              description: item.description as string | null,
              fileName: item.fileName as string | null,
              fileUrl: item.fileUrl as string | null,
              mimeType: item.mimeType as string | null,
              fileSize: item.fileSize as number | null,
            },
          });
          stats.documents++;
        }
      }
    }

    // 4. Companies
    if (Array.isArray(data.companies)) {
      for (const comp of data.companies) {
        const item = comp as Record<string, unknown>;
        if (item.id) {
          await tx.company.upsert({
            where: { id: item.id as string },
            update: {
              name: item.name as string,
              street: item.street as string | null,
              postalCode: item.postalCode as string | null,
              city: item.city as string | null,
              country: (item.country as string) || "Deutschland",
              website: item.website as string | null,
              contactName: item.contactName as string | null,
              contactEmail: item.contactEmail as string | null,
              contactPhone: item.contactPhone as string | null,
              notes: item.notes as string | null,
              status: (item.status as string) || "LEAD",
            },
            create: {
              id: item.id as string,
              name: (item.name as string) || "Unternehmen",
              street: item.street as string | null,
              postalCode: item.postalCode as string | null,
              city: item.city as string | null,
              country: (item.country as string) || "Deutschland",
              website: item.website as string | null,
              contactName: item.contactName as string | null,
              contactEmail: item.contactEmail as string | null,
              contactPhone: item.contactPhone as string | null,
              notes: item.notes as string | null,
              status: (item.status as string) || "LEAD",
            },
          });
          stats.companies++;
        }
      }
    }

    // 5. JobPostings
    if (Array.isArray(data.jobPostings)) {
      for (const job of data.jobPostings) {
        const item = job as Record<string, unknown>;
        if (item.id) {
          await tx.jobPosting.upsert({
            where: { id: item.id as string },
            update: {
              title: item.title as string,
              description: item.description as string,
              portalSource: item.portalSource as string,
              sourceUrl: item.sourceUrl as string | null,
              location: item.location as string | null,
              remote: Boolean(item.remote),
              requirementsProfile: item.requirementsProfile as string | null,
              techStack: item.techStack as string | null,
              salaryInfo: item.salaryInfo as string | null,
              matchScore: item.matchScore as number | null,
              companyId: item.companyId as string | null,
            },
            create: {
              id: item.id as string,
              title: item.title as string,
              description: item.description as string,
              portalSource: (item.portalSource as string) || "OTHER",
              sourceUrl: item.sourceUrl as string | null,
              location: item.location as string | null,
              remote: Boolean(item.remote),
              requirementsProfile: item.requirementsProfile as string | null,
              techStack: item.techStack as string | null,
              salaryInfo: item.salaryInfo as string | null,
              matchScore: item.matchScore as number | null,
              companyId: item.companyId as string | null,
            },
          });
          stats.jobPostings++;
        }
      }
    }

    // 6. Applications
    if (Array.isArray(data.applications)) {
      for (const app of data.applications) {
        const item = app as Record<string, unknown>;
        if (item.id && item.companyId) {
          const applicationDate = item.applicationDate ? new Date(item.applicationDate as string) : null;
          const nextStepDate = item.nextStepDate ? new Date(item.nextStepDate as string) : null;

          await tx.application.upsert({
            where: { id: item.id as string },
            update: {
              position: item.position as string,
              status: item.status as string,
              applicationDate,
              nextStep: item.nextStep as string | null,
              nextStepDate,
              notes: item.notes as string | null,
              source: item.source as string | null,
              companyId: item.companyId as string,
              jobPostingId: item.jobPostingId as string | null,
            },
            create: {
              id: item.id as string,
              position: item.position as string,
              status: item.status as string,
              applicationDate,
              nextStep: item.nextStep as string | null,
              nextStepDate,
              notes: item.notes as string | null,
              source: item.source as string | null,
              companyId: item.companyId as string,
              jobPostingId: item.jobPostingId as string | null,
            },
          });

          // Status Events
          if (Array.isArray(item.statusEvents)) {
            await tx.applicationStatusEvent.deleteMany({ where: { applicationId: item.id as string } });
            for (const ev of item.statusEvents) {
              const eventItem = ev as Record<string, unknown>;
              await tx.applicationStatusEvent.create({
                data: {
                  applicationId: item.id as string,
                  status: (eventItem.status as string) || "DRAFT",
                  note: eventItem.note as string | null,
                  changedAt: eventItem.changedAt ? new Date(eventItem.changedAt as string) : new Date(),
                },
              });
            }
          }

          // Cover Letter
          if (item.coverLetter && typeof item.coverLetter === "object") {
            const cl = item.coverLetter as Record<string, unknown>;
            await tx.coverLetter.upsert({
              where: { applicationId: item.id as string },
              update: {
                content: (cl.content as string) || "",
                status: (cl.status as string) || "DRAFT",
              },
              create: {
                applicationId: item.id as string,
                content: (cl.content as string) || "",
                status: (cl.status as string) || "DRAFT",
              },
            });
          }

          stats.applications++;
        }
      }
    }
  });

  return { success: true, stats };
}
