// -----------------------------------------------------------------------------
// Gemeinsame Logik für "Status ändern" — schreibt Status + Status-Historie-
// Eintrag in einer Transaktion. Wird von POST /api/applications/:id/status
// (manuelle Änderung) UND von POST /api/email-sync/pending (Annahme eines
// E-Mail-Vorschlags aus der Antworten-Inbox) verwendet, damit beide Pfade
// exakt dasselbe Verhalten (Historie, Push-Benachrichtigung) haben.
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/core/prisma";
import { sendDueNotifications } from "@/lib/settings/pushNotifications";

export async function applyApplicationStatusChange(applicationId: string, status: string, note?: string | null) {
  const application = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status,
      statusEvents: { create: { status, note: note ?? null } },
    },
    include: { company: true, jobPosting: true, statusEvents: { orderBy: { changedAt: "desc" } } },
  });

  // Fire-and-forget: verschickt u.a. Web-Push für Absage/Zusage/Interview
  // (siehe src/lib/pushNotifications.ts). Bewusst NICHT awaited.
  void sendDueNotifications();

  return application;
}
