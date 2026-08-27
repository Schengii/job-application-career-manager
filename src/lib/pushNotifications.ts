// -----------------------------------------------------------------------------
// Web-Push-Versand: verschickt fällige Benachrichtigungen (Termine, Absagen,
// Zusagen, Interview-Einladungen — siehe src/lib/notifications.ts) an alle
// registrierten Browser-Subscriptions (PushSubscription-Modell).
// -----------------------------------------------------------------------------
// Nie werfend: jeder Fehlerpfad (einzelner Versand, Datenbankzugriff) wird
// abgefangen und geloggt, damit ein Push-Fehlschlag nie eine aufrufende
// Route (Statuswechsel, Scheduler-Tick) zum Scheitern bringt — Web-Push ist
// eine "Best-effort"-Zusatzbenachrichtigung, kein kritischer Pfad.
// -----------------------------------------------------------------------------
import webpush from "web-push";
import { prisma } from "./prisma";
import { getVapidKeys } from "./vapidKeys";
import { getNotificationsFromApplications, type AppNotification } from "./notifications";
import type { MatchedEmailAction } from "./emailImapSync";
import type { ApplicationListItem, PushSubscription } from "@/types";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Verschickt eine einzelne Push-Nachricht an eine Subscription. Räumt bei
 * HTTP 404/410 (Subscription vom Browser/Push-Dienst als ungültig verworfen,
 * z.B. nach Deinstallation oder abgelaufenem Endpoint) die tote Subscription
 * automatisch aus der DB — sonst würde jeder künftige Sync-Lauf erneut
 * denselben nutzlosen Versand versuchen.
 */
export async function sendPushToSubscription(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  const { publicKey, privateKey } = getVapidKeys();
  webpush.setVapidDetails("mailto:noreply@localhost", publicKey, privateKey);

  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => {
        // Bereits gelöscht (z.B. Race mit einem parallelen Sync-Lauf) — kein Problem.
      });
    } else {
      console.error("pushNotifications: Versand an eine Subscription fehlgeschlagen.", error);
    }
    return false;
  }
}

function toPushPayload(notification: AppNotification): PushPayload {
  return {
    title: notification.title,
    body: `${notification.companyName} — ${notification.message}`,
    url: `/applications/${notification.applicationId}`,
    tag: notification.id,
  };
}

export type SendDueNotificationsResult = { sent: number; skipped: number };

/**
 * Ermittelt alle fälligen, noch nicht per Push versendeten Benachrichtigungen
 * (Dedup über SentPushNotification, s. prisma/schema.prisma) und verschickt
 * sie an alle registrierten Browser-Subscriptions. Wird von
 * src/lib/scheduler.ts periodisch sowie direkt nach einem Statuswechsel
 * aufgerufen (siehe /api/applications/[id]/status, /api/email-sync PUT).
 */
export async function sendDueNotifications(): Promise<SendDueNotificationsResult> {
  try {
    const applications = (await prisma.application.findMany({
      include: {
        company: true,
        statusEvents: {
          orderBy: { changedAt: "desc" },
          take: 3,
          select: { id: true, status: true, changedAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })) as unknown as ApplicationListItem[];

    // Die client-seitige "dismissedIds"-Liste (localStorage, s.
    // useDismissedNotifications.ts) ist hier irrelevant — Dedup läuft
    // ausschließlich server-seitig über SentPushNotification, unabhängig
    // davon, ob der Nutzer eine Benachrichtigung im Browser weggeklickt hat.
    const notifications = getNotificationsFromApplications(applications, []);
    if (notifications.length === 0) return { sent: 0, skipped: 0 };

    const alreadySent = new Set(
      (await prisma.sentPushNotification.findMany({ select: { id: true } })).map((row) => row.id)
    );
    const due = notifications.filter((n) => !alreadySent.has(n.id));
    if (due.length === 0) return { sent: 0, skipped: notifications.length };

    const subscriptions = await prisma.pushSubscription.findMany();

    let sent = 0;
    for (const notification of due) {
      const payload = toPushPayload(notification);
      for (const subscription of subscriptions) {
        const ok = await sendPushToSubscription(subscription, payload);
        if (ok) sent++;
      }
      // Als "bearbeitet" markieren, auch wenn aktuell keine Subscription
      // registriert ist (subscriptions.length === 0) — sonst würde diese
      // Benachrichtigung sofort erneut als "fällig" gelten, sobald sich der
      // Nutzer später doch für Push anmeldet, obwohl sie ggf. längst
      // veraltet ist.
      await prisma.sentPushNotification.upsert({
        where: { id: notification.id },
        update: {},
        create: { id: notification.id },
      });
    }

    return { sent, skipped: notifications.length - due.length };
  } catch (error) {
    console.error("pushNotifications: sendDueNotifications() fehlgeschlagen.", error);
    return { sent: 0, skipped: 0 };
  }
}

/**
 * Verschickt eine Push-Benachrichtigung für jede vom automatischen
 * Hintergrund-Sync neu erkannte E-Mail mit vorgeschlagenem Statuswechsel
 * (`statusChanged === true`, siehe src/lib/emailImapSync.ts). Der Sync selbst
 * ändert den Status NICHT automatisch (bleibt bewusst ein manueller 1-Klick-
 * Schritt, siehe src/lib/scheduler.ts) — diese Benachrichtigung macht den
 * Nutzer nur darauf aufmerksam, dass ein Vorschlag wartet. Dedup läuft über
 * eine eigene, pro (Bewerbung, E-Mail) stabile ID in SentPushNotification,
 * getrennt von den ID-Namensräumen aus src/lib/notifications.ts.
 */
export async function sendEmailMatchNotifications(
  matchedActions: MatchedEmailAction[]
): Promise<SendDueNotificationsResult> {
  try {
    const relevant = matchedActions.filter((action) => action.statusChanged);
    if (relevant.length === 0) return { sent: 0, skipped: 0 };

    const alreadySent = new Set(
      (await prisma.sentPushNotification.findMany({ select: { id: true } })).map((row) => row.id)
    );

    const subscriptions = await prisma.pushSubscription.findMany();
    let sent = 0;
    let skipped = 0;

    for (const action of relevant) {
      const id = `email-match-${action.application.id}-${action.email.id}`;
      if (alreadySent.has(id)) {
        skipped++;
        continue;
      }

      const payload: PushPayload = {
        title: "Neue E-Mail erkannt",
        body: `${action.application.company.name}: ${action.email.subject} — Statusvorschlag prüfen.`,
        url: `/applications/${action.application.id}`,
        tag: id,
      };
      for (const subscription of subscriptions) {
        const ok = await sendPushToSubscription(subscription, payload);
        if (ok) sent++;
      }
      await prisma.sentPushNotification.upsert({ where: { id }, update: {}, create: { id } });
    }

    return { sent, skipped };
  } catch (error) {
    console.error("pushNotifications: sendEmailMatchNotifications() fehlgeschlagen.", error);
    return { sent: 0, skipped: 0 };
  }
}
