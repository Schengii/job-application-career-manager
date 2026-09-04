// -----------------------------------------------------------------------------
// Wöchentlicher Erinnerungs-Digest
// -----------------------------------------------------------------------------
// Fasst die aktuell offenen Benachrichtigungen (überfällige Termine,
// anstehende Termine, empfohlene Nachfassaktionen, neue Status-Rückmeldungen
// — siehe src/lib/notifications.ts) zu EINER Zusammenfassung zusammen, statt
// jede einzeln per Push zu verschicken. Ergänzt die bestehenden Einzel-Push-
// Benachrichtigungen (sendDueNotifications() in pushNotifications.ts bleibt
// unverändert bestehen), gibt aber zusätzlich einmal pro Woche einen
// Überblick über den Gesamtzustand des Bewerbungstrichters.
// -----------------------------------------------------------------------------
import { getNotificationsFromApplications, type NotificationSourceApplication } from "@/lib/applications/notifications";

const DIGEST_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export type WeeklyDigestSummary = {
  overdueCount: number;
  dueSoonCount: number;
  followUpCount: number;
  responseCount: number; // REJECTED | OFFER | INTERVIEW zusammen
  totalCount: number;
  title: string;
  body: string;
  // Ziel-URL für den Klick auf die Push-Benachrichtigung (s.
  // sendWeeklyDigestIfDue() in pushNotifications.ts). Enthält der Digest
  // neue Status-Rückmeldungen, führt der Klick in die konsolidierte
  // E-Mail-Antworten-Inbox (/inbox) statt (wie zuvor) nur aufs Dashboard —
  // dort lassen sich ggf. noch offene Vorschläge direkt annehmen/ablehnen.
  // Andernfalls (nur Termine/Nachfassen) bleibt es beim Dashboard, da es
  // keine EINZELNE Bewerbung gibt, auf die sinnvoll verlinkt werden könnte.
  url: string;
};

/**
 * Baut die Digest-Zusammenfassung aus den aktuell offenen Benachrichtigungen.
 * Gibt `null` zurück, wenn es nichts zu berichten gibt — dann wird auch kein
 * (leerer, nutzloser) Push verschickt, siehe sendWeeklyDigestIfDue() in
 * pushNotifications.ts.
 */
export function buildWeeklyDigest(applications: NotificationSourceApplication[]): WeeklyDigestSummary | null {
  const notifications = getNotificationsFromApplications(applications, []);
  if (notifications.length === 0) return null;

  const overdueCount = notifications.filter((n) => n.type === "OVERDUE").length;
  const dueSoonCount = notifications.filter((n) => n.type === "DUE_SOON").length;
  const followUpCount = notifications.filter((n) => n.type === "FOLLOW_UP").length;
  const responseCount = notifications.filter((n) => n.type === "REJECTED" || n.type === "OFFER" || n.type === "INTERVIEW").length;

  const parts: string[] = [];
  if (overdueCount > 0) parts.push(`${overdueCount} überfällige${overdueCount === 1 ? "r Termin" : " Termine"}`);
  if (dueSoonCount > 0) parts.push(`${dueSoonCount} anstehende${dueSoonCount === 1 ? "r Termin" : " Termine"}`);
  if (followUpCount > 0) parts.push(`${followUpCount}× Nachfassen empfohlen`);
  if (responseCount > 0) parts.push(`${responseCount} neue Rückmeldung${responseCount === 1 ? "" : "en"}`);

  return {
    overdueCount,
    dueSoonCount,
    followUpCount,
    responseCount,
    totalCount: notifications.length,
    title: "Wochenüberblick Bewerbungen",
    body: parts.join(" · "),
    url: responseCount > 0 ? "/inbox" : "/",
  };
}

/**
 * Ob der wöchentliche Digest fällig ist: nur wenn in den Einstellungen
 * aktiviert (Default an) und entweder noch nie oder vor mindestens 7 Tagen
 * verschickt. Vermeidet, dass ein Nutzer bei jedem der 15-Minuten-Ticks eine
 * neue Zusammenfassung bekäme.
 */
export function isWeeklyDigestDue(preferences: { digestEnabled?: boolean | null; lastDigestSentAt?: Date | string | null }): boolean {
  if (preferences.digestEnabled === false) return false;
  if (!preferences.lastDigestSentAt) return true;
  const last = new Date(preferences.lastDigestSentAt).getTime();
  return Date.now() - last >= DIGEST_INTERVAL_MS;
}
