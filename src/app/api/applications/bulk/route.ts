// -----------------------------------------------------------------------------
// POST /api/applications/bulk -> Batch-Erstellung oder Inline-Speicherung von Zeilen
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { handleApiError } from "@/lib/core/apiUtils";
import { z } from "zod";

import { batchActionSchema } from "@/lib/core/validation";
import { addTag, removeTag } from "@/lib/core/tags";
import { createAutoSnapshot } from "@/lib/settings/serverBackupRotation";
import { generateCoverLetter } from "@/lib/documents/coverLetterGenerator";
import { getPreferencesWithProfile } from "@/lib/settings/preferences";

const bulkRowSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(1, "Unternehmensname ist erforderlich"),
  position: z.string().min(1, "Position ist erforderlich"),
  status: z.enum(["DRAFT", "SENT", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]).default("DRAFT"),
  applicationDate: z.string().nullable().optional(),
  portal: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  nextStep: z.string().nullable().optional(),
  nextStepDate: z.string().nullable().optional(),
});

const bulkPayloadSchema = z.object({
  rows: z.array(bulkRowSchema),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();

    // 1. Prüfe ob Batch-Aktion (z. B. Statusänderung, Löschung, Tags)
    if (json.action && json.applicationIds) {
      const batchData = batchActionSchema.parse(json);
      const { action, applicationIds } = batchData;

      if (action === "DELETE") {
        // Sicherheitsnetz: Eine Stapel-Löschung ist unwiderruflich (kein
        // "Papierkorb" für Bewerbungen). Vor dem eigentlichen Löschen wird
        // daher automatisch ein Snapshot des aktuellen Datenbestands
        // angelegt (siehe src/lib/serverBackupRotation.ts) — best-effort,
        // blockiert die Löschung nicht, falls das Schreiben fehlschlägt.
        await createAutoSnapshot(`bulk-delete-${applicationIds.length}-applications`);

        await prisma.application.deleteMany({
          where: { id: { in: applicationIds } },
        });
        return NextResponse.json({ success: true, count: applicationIds.length, action: "DELETE" });
      }

      if (action === "SET_STATUS" && batchData.status) {
        for (const id of applicationIds) {
          await prisma.application.update({
            where: { id },
            data: {
              status: batchData.status,
              rejectionReason: batchData.status === "REJECTED" ? batchData.rejectionReason : undefined,
              statusEvents: {
                create: {
                  status: batchData.status,
                  note: batchData.status === "REJECTED" && batchData.rejectionReason
                    ? `Stapel-Absage: ${batchData.rejectionReason}`
                    : "Status per Stapel-Aktion geändert",
                },
              },
            },
          });
        }
        return NextResponse.json({ success: true, count: applicationIds.length, action: "SET_STATUS" });
      }

      if (action === "ADD_TAG" && batchData.tag) {
        for (const id of applicationIds) {
          const app = await prisma.application.findUnique({ where: { id }, select: { tags: true } });
          const updatedTags = addTag(app?.tags, batchData.tag);
          await prisma.application.update({
            where: { id },
            data: { tags: updatedTags },
          });
        }
        return NextResponse.json({ success: true, count: applicationIds.length, action: "ADD_TAG" });
      }

      // Wendet das "Standard-Bewerbungspaket" (siehe /api/jobs/[id]/apply)
      // nachträglich auf bereits bestehende Bewerbungen an — z.B. für
      // Bewerbungen, die vor Einführung dieser Automatik oder manuell (ohne
      // den "Direkt bewerben"-Button) angelegt wurden. Bewusst additiv/
      // idempotent: bereits angehängte Standard-Dokumente werden nicht
      // doppelt angehängt, ein bereits vorhandenes Anschreiben wird NICHT
      // überschrieben.
      if (action === "APPLY_STANDARD_PACKAGE") {
        const profile = await getPreferencesWithProfile();
        const defaultDocuments = await prisma.document.findMany({ where: { isDefault: true }, select: { id: true } });

        let documentsAttached = 0;
        let coverLettersGenerated = 0;

        for (const id of applicationIds) {
          const application = await prisma.application.findUnique({
            where: { id },
            include: { company: true, jobPosting: true, coverLetter: true, documents: true },
          });
          if (!application) continue;

          if (defaultDocuments.length > 0) {
            const alreadyAttached = new Set(application.documents.map((d) => d.documentId));
            const toAttach = defaultDocuments.filter((doc) => !alreadyAttached.has(doc.id));
            if (toAttach.length > 0) {
              await prisma.applicationDocument.createMany({
                data: toAttach.map((doc) => ({ applicationId: id, documentId: doc.id })),
              });
              documentsAttached += toAttach.length;
            }
          }

          if (!application.coverLetter) {
            // useAi: false — bei einer Massenaktion über potenziell viele
            // Bewerbungen würde ein KI-Request pro Bewerbung (Sekunden
            // Latenz + Kosten) die Aktion unvorhersehbar verlangsamen und
            // verteuern; die Einleitungssatz-Vorlage greift hier direkt
            // (siehe src/lib/coverLetterGenerator.ts).
            const { content } = await generateCoverLetter({
              company: application.company,
              job: application.jobPosting,
              profile,
              position: application.position,
              useAi: false,
            });
            await prisma.coverLetter.create({ data: { applicationId: id, content, status: "DRAFT" } });
            coverLettersGenerated += 1;
          }
        }

        return NextResponse.json({
          success: true,
          count: applicationIds.length,
          action: "APPLY_STANDARD_PACKAGE",
          documentsAttached,
          coverLettersGenerated,
        });
      }

      if (action === "REMOVE_TAG" && batchData.tag) {
        for (const id of applicationIds) {
          const app = await prisma.application.findUnique({ where: { id }, select: { tags: true } });
          const updatedTags = removeTag(app?.tags, batchData.tag);
          await prisma.application.update({
            where: { id },
            data: { tags: updatedTags },
          });
        }
        return NextResponse.json({ success: true, count: applicationIds.length, action: "REMOVE_TAG" });
      }

      return NextResponse.json({ error: "Ungültige Stapel-Aktion" }, { status: 400 });
    }

    // 2. Excel-Grid Zeilen-Batch Speichern
    const { rows } = bulkPayloadSchema.parse(json);
    const results = [];

    for (const row of rows) {
      // 1. Firma suchen oder anlegen
      let company = await prisma.company.findFirst({
        where: { name: { equals: row.companyName } },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: row.companyName,
            contactName: row.contactName || null,
            contactEmail: row.contactEmail || null,
            contactPhone: row.contactPhone || null,
          },
        });
      } else if (row.contactEmail || row.contactPhone || row.contactName) {
        // Optionale Kontaktdaten an Firma aktualisieren
        await prisma.company.update({
          where: { id: company.id },
          data: {
            contactName: row.contactName || company.contactName,
            contactEmail: row.contactEmail || company.contactEmail,
            contactPhone: row.contactPhone || company.contactPhone,
          },
        });
      }

      const appDate = row.applicationDate ? new Date(row.applicationDate) : null;
      const nextDate = row.nextStepDate ? new Date(row.nextStepDate) : null;

      if (row.id && !row.id.startsWith("temp-")) {
        // Bestehende Zeile aktualisieren
        const updated = await prisma.application.update({
          where: { id: row.id },
          data: {
            companyId: company.id,
            position: row.position,
            status: row.status,
            applicationDate: appDate,
            source: row.portal || null,
            notes: row.notes || null,
            nextStep: row.nextStep || null,
            nextStepDate: nextDate,
          },
        });
        results.push(updated);
      } else {
        // Neue Zeile anlegen
        const created = await prisma.application.create({
          data: {
            companyId: company.id,
            position: row.position,
            status: row.status,
            applicationDate: appDate,
            source: row.portal || null,
            notes: row.notes || null,
            nextStep: row.nextStep || null,
            nextStepDate: nextDate,
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json({ success: true, count: results.length, data: results });
  } catch (error) {
    return handleApiError(error);
  }
}
