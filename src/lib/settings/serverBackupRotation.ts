// -----------------------------------------------------------------------------
// Automatische Sicherheitskopien vor destruktiven Server-Aktionen
// -----------------------------------------------------------------------------
// `src/lib/backupRotation.ts` verwaltet manuell ausgelöste Backups nur im
// `localStorage` des Browsers (siehe Settings > Backup-Manager). Das schützt
// nicht vor Datenverlust durch eine serverseitige Batch-Aktion wie
// "10 Bewerbungen auf einmal löschen" (`/api/applications/bulk`, Aktion
// "DELETE") oder eine Wiederherstellung aus einer fremden Backup-Datei
// (`restoreFromBackup()` in backup.ts), die bestehende Datensätze
// überschreibt — ein Klick, und die Daten sind weg, ohne dass der Nutzer
// vorher manuell ein Backup gezogen hat.
//
// Diese Datei legt VOR einer solchen Aktion automatisch einen JSON-Snapshot
// der aktuellen Daten in der Tabelle `BackupSnapshot` ab (rotierend, die
// letzten `MAX_AUTO_SNAPSHOTS` Stände bleiben erhalten). Die Ablage in der
// Datenbank statt im Dateisystem ist nötig, weil das Dateisystem auf Vercel
// read-only bzw. flüchtig ist. Best-effort: Schlägt das Schreiben fehl, wird
// die eigentliche Aktion NICHT blockiert — nur eine Warnung geloggt.
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/core/prisma";
import { createFullBackup, type BackupData } from "@/lib/settings/backup";

const MAX_AUTO_SNAPSHOTS = 10;

function sanitizeLabel(label: string): string {
  return label.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60);
}

/**
 * Erstellt einen JSON-Snapshot des aktuellen Datenbestands (identisch zum
 * manuellen Export über `/api/backup`) und speichert ihn, BEVOR eine
 * destruktive Aktion ausgeführt wird. Wirft absichtlich keinen Fehler nach
 * außen — siehe Kommentar oben.
 */
export async function createAutoSnapshot(label: string): Promise<void> {
  try {
    const backup: BackupData = await createFullBackup();
    await prisma.backupSnapshot.create({
      data: { label: sanitizeLabel(label), data: JSON.parse(JSON.stringify(backup)) },
    });
    await pruneOldSnapshots();
  } catch (err) {
    console.warn(`serverBackupRotation: Auto-Snapshot ("${label}") fehlgeschlagen, Aktion wird trotzdem fortgesetzt:`, err);
  }
}

/** Behält nur die neuesten `MAX_AUTO_SNAPSHOTS` Auto-Snapshots. */
async function pruneOldSnapshots(): Promise<void> {
  const stale = await prisma.backupSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    skip: MAX_AUTO_SNAPSHOTS,
    select: { id: true },
  });
  if (stale.length === 0) return;
  await prisma.backupSnapshot.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
}

// -----------------------------------------------------------------------------
// Periodisches Backup (unabhängig von destruktiven Aktionen)
// -----------------------------------------------------------------------------
// Wird vom Hintergrund-Scheduler (src/lib/settings/scheduler.ts) bei jedem
// Tick aufgerufen — legt aber höchstens alle `PERIODIC_INTERVAL_MS`
// tatsächlich einen neuen Snapshot an. Teilt sich mit den destruktiven
// Auto-Snapshots dieselbe Rotation (`pruneOldSnapshots()`).
// -----------------------------------------------------------------------------
const PERIODIC_LABEL = "scheduled";
const PERIODIC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Stunden

/**
 * Legt genau dann einen neuen Snapshot an, wenn entweder noch nie einer
 * existiert oder der letzte periodische Snapshot älter als 24h ist.
 * Best-effort wie `createAutoSnapshot()` — wirft nie nach außen.
 */
export async function createPeriodicSnapshotIfDue(): Promise<void> {
  try {
    const newest = await prisma.backupSnapshot.findFirst({
      where: { label: PERIODIC_LABEL },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (newest && Date.now() - newest.createdAt.getTime() < PERIODIC_INTERVAL_MS) return; // noch aktuell genug

    await createAutoSnapshot(PERIODIC_LABEL);
  } catch (err) {
    console.warn("serverBackupRotation: Periodischer Snapshot-Check fehlgeschlagen:", err);
  }
}
