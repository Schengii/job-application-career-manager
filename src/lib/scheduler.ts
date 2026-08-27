// -----------------------------------------------------------------------------
// In-Process Hintergrund-Scheduler: läuft, solange der Node-Prozess lebt
// (gestartet über src/instrumentation.ts beim Serverstart), und führt
// periodisch zwei Dinge aus:
//   1. Bei aktiviertem IMAP: neue E-Mails abrufen (src/lib/imapClient.ts) und
//      bei erkannten Statuswechsel-Vorschlägen eine Push-Benachrichtigung
//      verschicken (der Status wird NICHT automatisch geändert — das bleibt
//      bewusst ein manueller 1-Klick-Schritt wie beim Test-Sync-Button, um
//      Fehlklassifikationen zu vermeiden).
//   2. Fällige Termin-/Follow-up-/Statuswechsel-Benachrichtigungen per Push
//      verschicken (src/lib/pushNotifications.ts).
// Über die Einstellungen (Preferences.backgroundSchedulerEnabled, Default
// true) abschaltbar.
// -----------------------------------------------------------------------------
import { prisma } from "./prisma";
import { getOrCreatePreferences } from "./preferences";
import { fetchInboxMessages } from "./imapClient";
import { processSyncedEmails } from "./emailImapSync";
import { sendDueNotifications, sendEmailMatchNotifications } from "./pushNotifications";
import type { ApplicationListItem } from "@/types";

const TICK_INTERVAL_MS = 15 * 60 * 1000;

// Next.js' Dev-Server ruft `instrumentation.ts` bei jedem Hot-Reload erneut
// auf — ein Modul-lokales Flag würde dabei jedes Mal zurückgesetzt (neues
// Modul-Binding), daher ein Flag auf `globalThis`, das den Reload übersteht.
const globalForScheduler = globalThis as unknown as {
  __careerManagerSchedulerTimer?: ReturnType<typeof setInterval>;
};

async function runBackgroundEmailSync(): Promise<void> {
  const preferences = await getOrCreatePreferences();
  if (!preferences.imapEnabled) return;

  const applications = (await prisma.application.findMany({
    include: {
      company: true,
      jobPosting: true,
      coverLetter: true,
      _count: { select: { statusEvents: true, documents: true } },
    },
    orderBy: { updatedAt: "desc" },
  })) as unknown as ApplicationListItem[];

  const { messages, usedRealImap } = await fetchInboxMessages(preferences, applications);
  // Ohne echte IMAP-Verbindung (fehlende/falsche Zugangsdaten) macht ein
  // automatischer Hintergrund-Sync mit Sample-Daten keinen Sinn — der Nutzer
  // sieht die simulierten Treffer ohnehin schon über den manuellen
  // "Postfach jetzt abrufen"/"Demo-Sync testen"-Button in den Einstellungen.
  if (!usedRealImap) return;

  const syncResult = processSyncedEmails(messages, applications);
  await sendEmailMatchNotifications(syncResult.matchedActions);
}

export async function runSchedulerTick(): Promise<void> {
  try {
    const preferences = await getOrCreatePreferences();
    if (preferences.backgroundSchedulerEnabled === false) return;

    await runBackgroundEmailSync().catch((error) => {
      console.error("scheduler: Hintergrund-E-Mail-Sync fehlgeschlagen.", error);
    });
    await sendDueNotifications().catch((error) => {
      console.error("scheduler: Push-Versand fehlgeschlagen.", error);
    });
  } catch (error) {
    console.error("scheduler: Tick fehlgeschlagen.", error);
  }
}

/** Startet den periodischen Timer (No-Op, falls bereits gestartet). */
export function startBackgroundScheduler(): void {
  if (globalForScheduler.__careerManagerSchedulerTimer) return;

  const timer = setInterval(() => {
    void runSchedulerTick();
  }, TICK_INTERVAL_MS);
  // Verhindert, dass der Timer allein den Node-Prozess am Beenden hindert
  // (z.B. beim sauberen Herunterfahren in einer Serverless-/Container-Umgebung).
  timer.unref?.();
  globalForScheduler.__careerManagerSchedulerTimer = timer;

  // Sofortiger erster Lauf, statt erst nach TICK_INTERVAL_MS auf den ersten
  // Sync/Push-Check zu warten.
  void runSchedulerTick();
}

/** Stoppt den Timer (v.a. für Tests). */
export function stopBackgroundScheduler(): void {
  if (globalForScheduler.__careerManagerSchedulerTimer) {
    clearInterval(globalForScheduler.__careerManagerSchedulerTimer);
    globalForScheduler.__careerManagerSchedulerTimer = undefined;
  }
}
