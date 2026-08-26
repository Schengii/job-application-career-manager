// -----------------------------------------------------------------------------
// Benachrichtigungs-Logik für Termine, Fristen und Nachfass-Aktionen
// -----------------------------------------------------------------------------
import type { ApplicationListItem } from "@/types";
import { getFollowUpStatus } from "@/lib/followUp";

export type AppNotification = {
  id: string;
  applicationId: string;
  type: "OVERDUE" | "DUE_SOON" | "FOLLOW_UP" | "REJECTED" | "OFFER" | "INTERVIEW";
  title: string;
  message: string;
  companyName: string;
  position: string;
  date?: string | null;
  priority: "high" | "medium" | "low";
};

// Beschreibt, wie ein Statuswechsel (Application.status === Ziel-Status der
// jeweils letzten ApplicationStatusEvent) als Benachrichtigung dargestellt
// wird. Absage/Zusage/Gesprächseinladung sind Rückmeldungen des Unternehmens
// (ob manuell gesetzt oder automatisch per E-Mail-Sync erkannt, siehe
// src/lib/emailResponseParser.ts) und werden — anders als die terminbasierten
// Benachrichtigungen oben — nicht nach Zeit gefiltert: die Benachrichtigungs-ID
// basiert auf der ID des jeweiligen Status-Events, bleibt also nach dem
// Ausblenden dauerhaft ausgeblendet, ohne dass ein Zeitfenster nötig ist.
const STATUS_NOTIFICATION_META: Record<
  string,
  { type: AppNotification["type"]; title: string; message: (position: string) => string; priority: AppNotification["priority"] }
> = {
  REJECTED: {
    type: "REJECTED",
    title: "Absage erhalten",
    message: (position) => `Absage für "${position}" registriert.`,
    priority: "medium",
  },
  OFFER: {
    type: "OFFER",
    title: "Zusage / Angebot erhalten 🎉",
    message: (position) => `Zusage für "${position}" registriert — Glückwunsch!`,
    priority: "high",
  },
  INTERVIEW: {
    type: "INTERVIEW",
    title: "Einladung zum Vorstellungsgespräch",
    message: (position) => `Einladung zum Gespräch für "${position}" registriert.`,
    priority: "high",
  },
};

export function getNotificationsFromApplications(
  applications: ApplicationListItem[],
  dismissedIds: string[] = []
): AppNotification[] {
  const notifications: AppNotification[] = [];

  for (const app of applications) {
    const followUp = getFollowUpStatus(app);

    // 0. Absage / Zusage / Interview-Einladung — abgeleitet aus dem jeweils
    // letzten Status-Event, sofern es (noch) dem aktuellen Status entspricht
    // (verhindert veraltete Meldungen, falls der Status danach erneut
    // geändert wurde, z.B. nach einer fälschlich erkannten Absage).
    const latestStatusEvent = app.statusEvents?.[0];
    const statusMeta = latestStatusEvent && STATUS_NOTIFICATION_META[latestStatusEvent.status];
    if (latestStatusEvent && statusMeta && latestStatusEvent.status === app.status) {
      const notifId = `status-${latestStatusEvent.id}`;
      if (!dismissedIds.includes(notifId)) {
        notifications.push({
          id: notifId,
          applicationId: app.id,
          type: statusMeta.type,
          title: statusMeta.title,
          message: statusMeta.message(app.position),
          companyName: app.company.name,
          position: app.position,
          date: latestStatusEvent.changedAt ? new Date(latestStatusEvent.changedAt).toISOString() : null,
          priority: statusMeta.priority,
        });
      }
    }

    // 1. Überfälliger Termin
    if (followUp.isOverdue && app.nextStepDate) {
      const notifId = `overdue-${app.id}`;
      if (!dismissedIds.includes(notifId)) {
        notifications.push({
          id: notifId,
          applicationId: app.id,
          type: "OVERDUE",
          title: "Termin / Schritt überfällig!",
          message: `${app.nextStep || "Fälliger Schritt"} war am ${new Date(app.nextStepDate).toLocaleDateString("de-DE")}`,
          companyName: app.company.name,
          position: app.position,
          date: app.nextStepDate ? new Date(app.nextStepDate).toISOString() : null,
          priority: "high",
        });
      }
    }

    // 2. Anstehender Termin in den nächsten 48h
    if (followUp.isDueSoon && !followUp.isOverdue && app.nextStepDate) {
      const notifId = `duesoon-${app.id}`;
      if (!dismissedIds.includes(notifId)) {
        notifications.push({
          id: notifId,
          applicationId: app.id,
          type: "DUE_SOON",
          title: "Anstehender Gesprächstermin",
          message: `${app.nextStep || "Termin"} am ${new Date(app.nextStepDate).toLocaleDateString("de-DE")}`,
          companyName: app.company.name,
          position: app.position,
          date: app.nextStepDate ? new Date(app.nextStepDate).toISOString() : null,
          priority: "medium",
        });
      }
    }

    // 3. Nachfassen empfohlen (> 14 Tage ohne Rückmeldung)
    if (followUp.isFollowUpSuggested) {
      const notifId = `followup-${app.id}`;
      if (!dismissedIds.includes(notifId)) {
        notifications.push({
          id: notifId,
          applicationId: app.id,
          type: "FOLLOW_UP",
          title: "Nachfassen empfohlen",
          message: `Seit ${followUp.daysSinceApplication} Tagen keine Rückmeldung erhalten.`,
          companyName: app.company.name,
          position: app.position,
          date: app.applicationDate ? new Date(app.applicationDate).toISOString() : null,
          priority: "medium",
        });
      }
    }
  }

  // Sortiere nach Priorität (High zuerst)
  const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
  notifications.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  return notifications;
}
