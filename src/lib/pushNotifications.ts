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
import { buildWeeklyDigest, isWeeklyDigestDue } from "./digest";
import type { MatchedEmailAction } from "./emailImapSync";
import type { PushSubscription } from "@/types";

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

/**
 * Beansprucht eine Benachrichtigungs-ID atomar über die Unique-Constraint auf
 * `SentPushNotification.id`, BEVOR irgendein Push verschickt wird — statt
 * (wie zuvor) erst eine Momentaufnahme der bereits gesendeten IDs zu lesen
 * und den Dedup-Eintrag erst NACH dem Versand zu schreiben. Letzteres ist ein
 * klassisches Check-then-Act-Rennen: sendDueNotifications() wird von 3
 * unsynchronisierten Stellen aufgerufen (Scheduler-Tick, Statuswechsel-Route,
 * E-Mail-Sync-Route) — laufen zwei Aufrufe zeitlich überlappend, würden ohne
 * dieses atomare Claim beide dieselbe (noch nicht als gesendet markierte)
 * Benachrichtigung sehen und doppelt an alle Subscriptions verschicken.
 * Gibt `false` zurück, wenn ein anderer, gleichzeitig laufender Aufruf diese
 * ID bereits beansprucht hat (Unique-Constraint-Verletzung, Prisma-Code
 * P2002) — das ist der Normalfall bei Überschneidungen, kein echter Fehler.
 */
async function tryClaimNotification(id: string): Promise<boolean> {
  try {
    await prisma.sentPushNotification.create({ data: { id } });
    return true;
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") return false;
    throw error;
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
    // Absichtlich NUR die von getNotificationsFromApplications() benötigten
    // Felder/Relationen laden (siehe NotificationSourceApplication in
    // notifications.ts) — kein Cast auf das volle ApplicationListItem nötig,
    // das zusätzlich jobPosting/coverLetter/_count verlangen würde, welche
    // dieser Query bewusst nicht lädt.
    const applications = await prisma.application.findMany({
      select: {
        id: true,
        status: true,
        position: true,
        applicationDate: true,
        nextStepDate: true,
        nextStep: true,
        company: { select: { name: true } },
        statusEvents: {
          orderBy: { changedAt: "desc" },
          take: 3,
          select: { id: true, status: true, changedAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

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
    let skipped = notifications.length - due.length;
    for (const notification of due) {
      // Claim VOR dem Versand (s. tryClaimNotification) — verhindert, dass
      // ein zeitlich überlappender zweiter Aufruf (Scheduler-Tick,
      // Statuswechsel-Route, E-Mail-Sync) dieselbe Benachrichtigung erneut
      // verschickt, auch wenn diese `alreadySent`-Momentaufnahme sie noch
      // nicht kannte.
      const claimed = await tryClaimNotification(notification.id);
      if (!claimed) {
        skipped++;
        continue;
      }

      const payload = toPushPayload(notification);
      for (const subscription of subscriptions) {
        const ok = await sendPushToSubscription(subscription, payload);
        if (ok) sent++;
      }
    }

    return { sent, skipped };
  } catch (error) {
    console.error("pushNotifications: sendDueNotifications() fehlgeschlagen.", error);
    return { sent: 0, skipped: 0 };
  }
}

export type SendWeeklyDigestResult = { sent: boolean; summary?: string; sentCount: number };

/**
 * Verschickt höchstens einmal pro Woche (siehe isWeeklyDigestDue() in
 * src/lib/digest.ts) EINE zusammenfassende Push-Benachrichtigung über alle
 * aktuell offenen Benachrichtigungen, statt sie nur einzeln (s.
 * sendDueNotifications() oben) zu verschicken. Wird von
 * src/lib/scheduler.ts bei jedem Tick aufgerufen — der Fälligkeits-Check
 * innerhalb dieser Funktion sorgt dafür, dass tatsächlich nur einmal pro
 * Woche etwas verschickt wird.
 */
export async function sendWeeklyDigestIfDue(): Promise<SendWeeklyDigestResult> {
  try {
    const preferences = await prisma.preferences.findUnique({ where: { id: "default" } });
    if (!preferences || !isWeeklyDigestDue(preferences)) return { sent: false, sentCount: 0 };

    const applications = await prisma.application.findMany({
      select: {
        id: true,
        status: true,
        position: true,
        applicationDate: true,
        nextStepDate: true,
        nextStep: true,
        company: { select: { name: true } },
        statusEvents: {
          orderBy: { changedAt: "desc" },
          take: 3,
          select: { id: true, status: true, changedAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const digest = buildWeeklyDigest(applications);

    // Der Fälligkeitszeitpunkt wird in JEDEM Fall aktualisiert (auch ohne
    // etwas zu berichten) — sonst würde bei einem leeren Trichter jeder
    // künftige Tick erneut prüfen, statt erst wieder in 7 Tagen.
    await prisma.preferences.update({
      where: { id: "default" },
      data: { lastDigestSentAt: new Date() },
    });

    if (!digest) return { sent: false, sentCount: 0 };

    const subscriptions = await prisma.pushSubscription.findMany();
    const payload: PushPayload = {
      title: digest.title,
      body: digest.body,
      url: "/",
      tag: `weekly-digest-${new Date().toISOString().slice(0, 10)}`,
    };

    let sentCount = 0;
    for (const subscription of subscriptions) {
      const ok = await sendPushToSubscription(subscription, payload);
      if (ok) sentCount++;
    }

    return { sent: true, summary: digest.body, sentCount };
  } catch (error) {
    console.error("pushNotifications: sendWeeklyDigestIfDue() fehlgeschlagen.", error);
    return { sent: false, sentCount: 0 };
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

      // Claim VOR dem Versand — s. Kommentar bei tryClaimNotification()/
      // sendDueNotifications() oben.
      const claimed = await tryClaimNotification(id);
      if (!claimed) {
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
    }

    return { sent, skipped };
  } catch (error) {
    console.error("pushNotifications: sendEmailMatchNotifications() fehlgeschlagen.", error);
    return { sent: 0, skipped: 0 };
  }
}
