// -----------------------------------------------------------------------------
// Benachrichtigungs-Logik für Termine, Fristen und Nachfass-Aktionen
// -----------------------------------------------------------------------------
import type { Application, ApplicationStatusEvent, Company } from "@/types";
import { getFollowUpStatus } from "@/lib/followUp";

// Bewusst NUR die Felder, die getNotificationsFromApplications() unten
// tatsächlich liest — NICHT das volle `ApplicationListItem` (das zusätzlich
// `jobPosting`/`coverLetter`/`_count` verlangt). Aufrufer wie
// src/lib/pushNotifications.ts laden die Applications serverseitig gezielt
// OHNE diese (hier ungenutzten) Relationen; ein `ApplicationListItem`-Cast an
// dieser Stelle würde vortäuschen, sie seien vorhanden, obwohl sie es zur
// Laufzeit nicht sind. `ApplicationListItem` erfüllt diesen (schmaleren) Typ
// strukturell weiterhin, bestehende Aufrufer (NotificationBell,
// RecentResponsesCard) bleiben also unverändert kompatibel.
export type NotificationSourceApplication = Pick<
  Application,
  "id" | "status" | "position" | "applicationDate" | "nextStepDate" | "nextStep"
> & {
  company: Pick<Company, "name">;
  statusEvents?: Pick<ApplicationStatusEvent, "id" | "status" | "changedAt">[];
};

export type AppNotification = {
  id: string;
  applicationId: string;
  type: "OVERDUE" | "DUE_SOON" | "FOLLOW_UP" | "REJECTED" | "OFFER" | "INTERVIEW" | "EMAIL_SUGGESTION";
  title: string;
  message: string;
  companyName: string;
  position: string;
  date?: string | null;
  priority: "high" | "medium" | "low";
};

// Minimaler Ausschnitt eines EmailSuggestion-Datensatzes (s.
// prisma/schema.prisma, `EmailSuggestionWithApplication` in
// src/types/index.ts), den getEmailSuggestionNotifications() unten benötigt.
// Anders als die Statuswechsel-Benachrichtigungen oben (die einen bereits
// ÜBERNOMMENEN Status widerspiegeln) betrifft dies einen noch UNBEARBEITETEN
// (PENDING) Vorschlag aus /inbox — daher eine eigene Notification-Quelle statt
// eines weiteren Zweigs in getNotificationsFromApplications().
export type PendingEmailSuggestion = {
  id: string;
  applicationId: string;
  statusLabel: string;
  emailDate: Date | string;
  application: { position: string; company: { name: string } };
};

/**
 * Baut Benachrichtigungen für noch offene (PENDING), per E-Mail-Sync
 * erkannte Status-Vorschläge (siehe /api/email-sync/pending, src/app/inbox).
 * Anders als die Benachrichtigungen aus getNotificationsFromApplications()
 * verlinkt der Aufrufer (NotificationBell) diese bewusst auf `/inbox` statt
 * auf die einzelne Bewerbung — dort lässt sich der Vorschlag direkt
 * annehmen/ablehnen, statt ihn nur read-only auf der Bewerbungsseite zu sehen.
 */
export function getEmailSuggestionNotifications(
  suggestions: PendingEmailSuggestion[],
  dismissedIds: string[] = []
): AppNotification[] {
  const notifications: AppNotification[] = [];

  for (const suggestion of suggestions) {
    // Defensiv: bei unerwartet geformten Daten (z. B. eine fehlgeschlagene
    // Fetch-Response, die nicht dem erwarteten Shape entspricht) lieber den
    // einzelnen Eintrag überspringen als die gesamte Benachrichtigungsliste
    // (und damit die App) mit einem Laufzeitfehler abstürzen zu lassen.
    if (!suggestion?.application?.company) continue;

    const notifId = `email-suggestion-${suggestion.id}`;
    if (dismissedIds.includes(notifId)) continue;

    notifications.push({
      id: notifId,
      applicationId: suggestion.applicationId,
      type: "EMAIL_SUGGESTION",
      title: "Neue E-Mail-Rückmeldung erkannt",
      message: `${suggestion.statusLabel} — Vorschlag in der Inbox prüfen.`,
      companyName: suggestion.application.company.name,
      position: suggestion.application.position,
      date: suggestion.emailDate ? new Date(suggestion.emailDate).toISOString() : null,
      priority: "high",
    });
  }

  return notifications;
}

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

/** `YYYY-MM-DD` für den Dedup-ID-Bestandteil unten — `null`/`undefined` wird zu einem stabilen Platzhalter statt die ID unbrauchbar zu machen. */
function toDateKey(date: Date | string | null | undefined): string {
  if (!date) return "unbekannt";
  return new Date(date).toISOString().slice(0, 10);
}

export function getNotificationsFromApplications(
  applications: NotificationSourceApplication[],
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
      // ID enthält bewusst das Zieldatum (nicht nur die Application-ID) —
      // sonst würde eine bereits einmal gesendete/dismissed Benachrichtigung
      // (SentPushNotification bzw. dismissedIds) nach einer Terminverschiebung
      // dauerhaft unterdrückt bleiben, obwohl der NEUE Termin einen eigenen
      // Hinweis verdient (siehe Code-Review-Finding "stale per-application dedup").
      const notifId = `overdue-${app.id}-${toDateKey(app.nextStepDate)}`;
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
      const notifId = `duesoon-${app.id}-${toDateKey(app.nextStepDate)}`;
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
      // Anker ist hier das Bewerbungsdatum statt eines Zieltermins (es gibt
      // keinen) — ändert sich dieses (z.B. nachträgliche Korrektur), ist das
      // ebenfalls ein neuer, eigenständiger Anlass für einen erneuten Hinweis.
      const notifId = `followup-${app.id}-${toDateKey(app.applicationDate)}`;
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
