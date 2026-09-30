// -----------------------------------------------------------------------------
// Backup & Restore Engine
// -----------------------------------------------------------------------------
// Ermöglicht den vollständigen Export und Import aller Anwendungsdaten
// (Profil, Unternehmen, Bewerbungen, Historie, Dokumenten-Metadaten) als
// portable JSON-Datei.
//
// Sicherheit: `preferences.aiApiKey` (der KI-API-Key des Nutzers, z. B. für
// OpenAI/Anthropic) und `preferences.imapPassword` (das IMAP-Passwort für den
// E-Mail-Auto-Sync) werden bewusst NICHT exportiert. Ein Backup landet leicht
// in Cloud-Speichern, E-Mail-Anhängen oder Support-Anfragen — selbst der
// verschlüsselte Chiffretext wäre dort ein unnötiges Risiko. Nach einem
// Restore müssen KI-Key und IMAP-Passwort daher ggf. erneut in den
// Einstellungen hinterlegt werden.
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/core/prisma";
import { backupSchema } from "@/lib/core/validation";
import { createAutoSnapshot } from "@/lib/settings/serverBackupRotation";
import type { z } from "zod";

export type BackupData = z.input<typeof backupSchema>;
type ParsedBackupData = z.infer<typeof backupSchema>;

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

  // aiApiKey & imapPassword bewusst herausfiltern (siehe Kommentar oben).
  const { aiApiKey: _aiApiKey, imapPassword: _imapPassword, ...preferencesWithoutSecret } = preferences ?? {};
  void _aiApiKey;
  void _imapPassword;

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    preferences: preferences ? preferencesWithoutSecret : null,
    educationEntries,
    projectEntries,
    companies,
    jobPostings,
    applications,
    documents,
  };
}

/**
 * Wandelt Restore-Eingaben, die als `string`, `Date` oder `null`/`undefined`
 * ankommen können (je nachdem, ob das Backup gerade frisch aus der DB kam
 * oder einen JSON.stringify/parse-Zyklus durchlaufen hat), in ein `Date`
 * bzw. `null` um.
 */
function toDate(value: string | Date | null | undefined, fallback: Date | null = null): Date | null {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export async function restoreFromBackup(rawData: unknown): Promise<{ success: boolean; stats: Record<string, number> }> {
  // Validiert Struktur & Typen der importierten Datei, bevor irgendetwas in
  // die Datenbank geschrieben wird. Wirft bei ungültigem Format einen
  // ZodError, den `handleApiError()` bereits als HTTP 400 mit Details
  // beantwortet (statt eines kryptischen 500ers durch einen fehlgeschlagenen
  // `as`-Cast irgendwo in der Transaktion).
  const data: ParsedBackupData = backupSchema.parse(rawData);

  // Sicherheitsnetz: Ein Restore überschreibt bestehende Datensätze mit
  // gleicher ID unwiderruflich (`upsert` mit `update:`). Vor dem Import wird
  // daher automatisch ein Snapshot des JETZT (vor dem Restore) aktuellen
  // Datenbestands angelegt — falls die importierte Datei versehentlich die
  // falsche/eine veraltete war, lässt sich der vorherige Stand aus
  // `./backups/` wiederherstellen. Best-effort, siehe
  // src/lib/serverBackupRotation.ts.
  await createAutoSnapshot("before-restore");

  const stats = {
    companies: 0,
    applications: 0,
    jobPostings: 0,
    documents: 0,
    educationEntries: 0,
    projectEntries: 0,
  };

  // Hinweis: PrismaNeonHttp unterstützt keine verschachtelten DB-Transaktionen ($transaction).
  // Daher werden die Tabellen sequenziell aktualisiert.

  // 1. Preferences wiederherstellen (aiApiKey bleibt unangetastet, siehe oben)
  if (data.preferences) {
    const pref = data.preferences;
    await prisma.preferences.upsert({
      where: { id: "default" },
      update: pref,
      create: { id: "default", ...pref },
    });
  }

  // 2. Education & Projects
  if (data.educationEntries) {
    await prisma.educationEntry.deleteMany({ where: { preferencesId: "default" } });
    for (const item of data.educationEntries) {
      await prisma.educationEntry.create({
        data: {
          id: item.id,
          type: item.type || "WEITERBILDUNG",
          title: item.title || "Ausbildung",
          institution: item.institution ?? null,
          startDate: toDate(item.startDate),
          endDate: toDate(item.endDate),
          description: item.description ?? null,
          sortOrder: item.sortOrder || 0,
          preferencesId: "default",
        },
      });
      stats.educationEntries++;
    }
  }

  if (data.projectEntries) {
    await prisma.projectEntry.deleteMany({ where: { preferencesId: "default" } });
    for (const item of data.projectEntries) {
      await prisma.projectEntry.create({
        data: {
          id: item.id,
          title: item.title || "Projekt",
          description: item.description ?? null,
          techStack: item.techStack ?? null,
          url: item.url ?? null,
          role: item.role ?? null,
          sortOrder: item.sortOrder || 0,
          preferencesId: "default",
        },
      });
      stats.projectEntries++;
    }
  }

  // 3. Documents
  if (data.documents) {
    for (const item of data.documents) {
      await prisma.document.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          category: item.category,
          description: item.description ?? null,
          fileName: item.fileName ?? null,
          fileUrl: item.fileUrl ?? null,
          mimeType: item.mimeType ?? null,
          fileSize: item.fileSize ?? null,
        },
        create: {
          id: item.id,
          name: item.name || "Dokument",
          category: item.category || "SONSTIGES",
          description: item.description ?? null,
          fileName: item.fileName ?? null,
          fileUrl: item.fileUrl ?? null,
          mimeType: item.mimeType ?? null,
          fileSize: item.fileSize ?? null,
        },
      });
      stats.documents++;
    }
  }

  // 4. Companies
  if (data.companies) {
    for (const item of data.companies) {
      await prisma.company.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          street: item.street ?? null,
          postalCode: item.postalCode ?? null,
          city: item.city ?? null,
          country: item.country || "Deutschland",
          website: item.website ?? null,
          contactName: item.contactName ?? null,
          contactEmail: item.contactEmail ?? null,
          contactPhone: item.contactPhone ?? null,
          notes: item.notes ?? null,
          tags: item.tags ?? null,
          status: item.status || "LEAD",
        },
        create: {
          id: item.id,
          name: item.name || "Unternehmen",
          street: item.street ?? null,
          postalCode: item.postalCode ?? null,
          city: item.city ?? null,
          country: item.country || "Deutschland",
          website: item.website ?? null,
          contactName: item.contactName ?? null,
          contactEmail: item.contactEmail ?? null,
          contactPhone: item.contactPhone ?? null,
          notes: item.notes ?? null,
          tags: item.tags ?? null,
          status: item.status || "LEAD",
        },
      });
      stats.companies++;
    }
  }

  // 5. JobPostings
  if (data.jobPostings) {
    for (const item of data.jobPostings) {
      await prisma.jobPosting.upsert({
        where: { id: item.id },
        update: {
          title: item.title,
          description: item.description,
          portalSource: item.portalSource || "OTHER",
          sourceUrl: item.sourceUrl ?? null,
          location: item.location ?? null,
          remote: Boolean(item.remote),
          requirementsProfile: item.requirementsProfile ?? null,
          techStack: item.techStack ?? null,
          salaryInfo: item.salaryInfo ?? null,
          matchScore: item.matchScore ?? null,
          companyId: item.companyId ?? null,
          isDismissed: Boolean(item.isDismissed),
          dismissReason: item.dismissReason ?? null,
          dismissedAt: toDate(item.dismissedAt),
        },
        create: {
          id: item.id,
          title: item.title || "Stellenangebot",
          description: item.description || "",
          portalSource: item.portalSource || "OTHER",
          sourceUrl: item.sourceUrl ?? null,
          location: item.location ?? null,
          remote: Boolean(item.remote),
          requirementsProfile: item.requirementsProfile ?? null,
          techStack: item.techStack ?? null,
          salaryInfo: item.salaryInfo ?? null,
          matchScore: item.matchScore ?? null,
          companyId: item.companyId ?? null,
          isDismissed: Boolean(item.isDismissed),
          dismissReason: item.dismissReason ?? null,
          dismissedAt: toDate(item.dismissedAt),
        },
      });
      stats.jobPostings++;
    }
  }

  // 6. Applications
  if (data.applications) {
    for (const item of data.applications) {
      if (!item.companyId) continue; // Application.companyId ist Pflichtfeld

      await prisma.application.upsert({
        where: { id: item.id },
        update: {
          position: item.position,
          status: item.status || "DRAFT",
          applicationDate: toDate(item.applicationDate),
          nextStep: item.nextStep ?? null,
          nextStepDate: toDate(item.nextStepDate),
          meetingUrl: item.meetingUrl ?? null,
          rejectionReason: item.rejectionReason ?? null,
          tags: item.tags ?? null,
          notes: item.notes ?? null,
          source: item.source ?? null,
          companyId: item.companyId,
          jobPostingId: item.jobPostingId ?? null,
        },
        create: {
          id: item.id,
          position: item.position || "Position",
          status: item.status || "DRAFT",
          applicationDate: toDate(item.applicationDate),
          nextStep: item.nextStep ?? null,
          nextStepDate: toDate(item.nextStepDate),
          meetingUrl: item.meetingUrl ?? null,
          rejectionReason: item.rejectionReason ?? null,
          tags: item.tags ?? null,
          notes: item.notes ?? null,
          source: item.source ?? null,
          companyId: item.companyId,
          jobPostingId: item.jobPostingId ?? null,
        },
      });

      // Status Events
      if (item.statusEvents) {
        await prisma.applicationStatusEvent.deleteMany({ where: { applicationId: item.id } });
        for (const ev of item.statusEvents) {
          await prisma.applicationStatusEvent.create({
            data: {
              applicationId: item.id,
              status: ev.status || "DRAFT",
              note: ev.note ?? null,
              changedAt: toDate(ev.changedAt, new Date()) ?? new Date(),
            },
          });
        }
      }

      // Cover Letter
      if (item.coverLetter) {
        await prisma.coverLetter.upsert({
          where: { applicationId: item.id },
          update: {
            content: item.coverLetter.content || "",
            status: item.coverLetter.status || "DRAFT",
          },
          create: {
            applicationId: item.id,
            content: item.coverLetter.content || "",
            status: item.coverLetter.status || "DRAFT",
          },
        });
      }

      stats.applications++;
    }
  }

  return { success: true, stats };
}
