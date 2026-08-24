// -----------------------------------------------------------------------------
// Benachrichtigungs-Logik für Termine, Fristen und Nachfass-Aktionen
// -----------------------------------------------------------------------------
import type { ApplicationListItem } from "@/types";
import { getFollowUpStatus } from "@/lib/followUp";

export type AppNotification = {
  id: string;
  applicationId: string;
  type: "OVERDUE" | "DUE_SOON" | "FOLLOW_UP";
  title: string;
  message: string;
  companyName: string;
  position: string;
  date?: string | null;
  priority: "high" | "medium" | "low";
};

export function getNotificationsFromApplications(
  applications: ApplicationListItem[],
  dismissedIds: string[] = []
): AppNotification[] {
  const notifications: AppNotification[] = [];

  for (const app of applications) {
    const followUp = getFollowUpStatus(app);

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
