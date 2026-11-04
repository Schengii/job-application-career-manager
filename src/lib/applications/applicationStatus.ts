// -----------------------------------------------------------------------------
// Gemeinsame Logik für "Status ändern" — schreibt Status + Status-Historie-
// Eintrag. Atomar ist das NICHT: PrismaNeonHttp unterstützt keine Transaktionen,
// daher wird erst der Historie-Eintrag und danach der Status geschrieben (bei einem
// Abbruch fehlt höchstens die Statusänderung, nie die Historie). Wird von POST /api/applications/:id/status
// (manuelle Änderung) UND von POST /api/email-sync/pending (Annahme eines
// E-Mail-Vorschlags aus der Antworten-Inbox) verwendet, damit beide Pfade
// exakt dasselbe Verhalten (Historie, Push-Benachrichtigung) haben.
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/core/prisma";
import { sendDueNotifications } from "@/lib/settings/pushNotifications";

export async function applyApplicationStatusChange(applicationId: string, status: string, note?: string | null) {
  // Existenz zuerst prüfen: unbekannte ID -> P2025 -> 404 (statt FK-Fehler P2003 -> 400).
  await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, select: { id: true } });

  // Historie danach: schlägt der Status-Update danach fehl, bleibt ein harmloser
  // zusätzlicher Eintrag statt einer Statusänderung ohne Nachweis.
  await prisma.applicationStatusEvent.create({
    data: {
      applicationId,
      status,
      note: note ?? null,
    },
  });

  await prisma.application.update({
    where: { id: applicationId },
    data: { status },
  });

  const application = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { company: true, jobPosting: true, statusEvents: { orderBy: { changedAt: "desc" } } },
  });

  // Fire-and-forget: verschickt u.a. Web-Push für Absage/Zusage/Interview
  // (siehe src/lib/pushNotifications.ts). Bewusst NICHT awaited.
  void sendDueNotifications();

  // Webhook-Benachrichtigung (Discord / Slack) falls konfiguriert
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (webhookUrl) {
    const { sendWebhookNotification } = await import("@/lib/settings/webhookNotifier");
    void sendWebhookNotification(webhookUrl, {
      title: `Status-Update: ${application.position}`,
      description: note || `Status wurde auf ${status} geändert.`,
      companyName: application.company.name,
      position: application.position,
      status,
      nextStep: application.nextStep,
      meetingUrl: application.meetingUrl,
    });
  }

  return application;
}
