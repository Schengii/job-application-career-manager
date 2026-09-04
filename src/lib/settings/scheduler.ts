// -----------------------------------------------------------------------------
// In-Process Hintergrund-Scheduler: läuft, solange der Node-Prozess lebt
// (gestartet über src/instrumentation.ts beim Serverstart), und führt
// periodisch drei Dinge aus:
//   1. Bei aktiviertem IMAP: neue E-Mails abrufen (src/lib/imapClient.ts) und
//      bei erkannten Statuswechsel-Vorschlägen eine Push-Benachrichtigung
//      verschicken (der Status wird NICHT automatisch geändert — das bleibt
//      bewusst ein manueller 1-Klick-Schritt wie beim Test-Sync-Button, um
//      Fehlklassifikationen zu vermeiden).
//   2. Fällige Termin-/Follow-up-/Statuswechsel-Benachrichtigungen per Push
//      verschicken (src/lib/pushNotifications.ts).
//   3. Höchstens einmal alle 24h ein automatisches Backup anlegen (siehe
//      src/lib/serverBackupRotation.ts) — unabhängig von destruktiven
//      Aktionen, damit auch bei reiner Nutzung ohne Löschen/Restore
//      regelmäßig ein aktueller Snapshot existiert.
//   4. Höchstens einmal pro Woche einen zusammenfassenden Erinnerungs-Digest
//      per Push verschicken (siehe src/lib/digest.ts,
//      pushNotifications.ts::sendWeeklyDigestIfDue()) — ergänzt die
//      Einzelbenachrichtigungen aus Schritt 2 um einen Gesamtüberblick.
// Über die Einstellungen (Preferences.backgroundSchedulerEnabled, Default
// true) abschaltbar.
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/core/prisma";
import { getOrCreatePreferences } from "@/lib/settings/preferences";
import { fetchInboxMessages } from "@/lib/email/imapClient";
import { processSyncedEmails } from "@/lib/email/emailImapSync";
import { sendDueNotifications, sendEmailMatchNotifications, sendWeeklyDigestIfDue } from "@/lib/settings/pushNotifications";
import { createPeriodicSnapshotIfDue } from "@/lib/settings/serverBackupRotation";
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Persistiert den zuletzt fehlgeschlagenen Hintergrund-Schritt in
 * `Preferences.lastSchedulerError*`, damit er im UI sichtbar wird (siehe
 * `background-scheduler-card.tsx`) statt nur im Server-Log zu verschwinden
 * (das war bislang der Fall — Fehler bei IMAP-Sync, Push-Versand oder Backup
 * blieben für den Nutzer komplett unsichtbar, solange die App selbst weiter
 * normal funktionierte).
 */
async function recordSchedulerError(source: "email_sync" | "push" | "backup" | "digest", error: unknown): Promise<void> {
  console.error(`scheduler: ${source} fehlgeschlagen.`, error);
  try {
    await prisma.preferences.update({
      where: { id: "default" },
      data: {
        lastSchedulerErrorSource: source,
        lastSchedulerErrorMessage: errorMessage(error).slice(0, 500),
        lastSchedulerErrorAt: new Date(),
      },
    });
  } catch (persistError) {
    // Best effort — falls sogar diese Schreiboperation fehlschlägt, bleibt es
    // beim reinen Server-Log-Eintrag oben.
    console.error("scheduler: Konnte Fehlerstatus nicht persistieren.", persistError);
  }
}

/** Setzt einen zuvor gespeicherten Scheduler-Fehler zurück, sobald ein Tick wieder ohne Fehler durchläuft. */
async function clearSchedulerError(): Promise<void> {
  await prisma.preferences
    .update({
      where: { id: "default" },
      data: { lastSchedulerErrorSource: null, lastSchedulerErrorMessage: null, lastSchedulerErrorAt: null },
    })
    .catch(() => {
      // Best effort, siehe recordSchedulerError().
    });
}

export async function runSchedulerTick(): Promise<void> {
  try {
    const preferences = await getOrCreatePreferences();
    if (preferences.backgroundSchedulerEnabled === false) return;

    let hadError = false;

    await runBackgroundEmailSync().catch((error) => {
      hadError = true;
      return recordSchedulerError("email_sync", error);
    });
    await sendDueNotifications().catch((error) => {
      hadError = true;
      return recordSchedulerError("push", error);
    });
    await createPeriodicSnapshotIfDue().catch((error) => {
      hadError = true;
      return recordSchedulerError("backup", error);
    });
    await sendWeeklyDigestIfDue().catch((error) => {
      hadError = true;
      return recordSchedulerError("digest", error);
    });

    if (!hadError && preferences.lastSchedulerErrorMessage) {
      await clearSchedulerError();
    }
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
