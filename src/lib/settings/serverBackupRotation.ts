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
// der aktuellen Daten unter `./backups/` ab (rotierend, die letzten
// `MAX_AUTO_SNAPSHOTS` Stände bleiben erhalten). Best-effort: Schlägt das
// Schreiben fehl (z.B. read-only Dateisystem bei manchem Hosting), wird die
// eigentliche Aktion NICHT blockiert — nur eine Warnung geloggt. Ein
// verpasster Auto-Snapshot ist ärgerlich, aber kein Grund, dem Nutzer seine
// eigentliche Aktion zu verweigern.
// -----------------------------------------------------------------------------
import { promises as fs } from "fs";
import path from "path";
import { createFullBackup, type BackupData } from "@/lib/settings/backup";

const BACKUP_DIR = path.join(process.cwd(), "backups");
const MAX_AUTO_SNAPSHOTS = 10;

function sanitizeLabel(label: string): string {
  return label.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60);
}

/**
 * Erstellt einen JSON-Snapshot des aktuellen Datenbestands (identisch zum
 * manuellen Export über `/api/backup`) und legt ihn unter `./backups/` ab,
 * BEVOR eine destruktive Aktion ausgeführt wird. Wirft absichtlich keinen
 * Fehler nach außen — siehe Kommentar oben.
 */
export async function createAutoSnapshot(label: string): Promise<void> {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const backup: BackupData = await createFullBackup();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `auto-${timestamp}-${sanitizeLabel(label)}.json`;
    await fs.writeFile(path.join(BACKUP_DIR, fileName), JSON.stringify(backup, null, 2), "utf-8");

    await pruneOldSnapshots();
  } catch (err) {
    console.warn(`serverBackupRotation: Auto-Snapshot ("${label}") fehlgeschlagen, Aktion wird trotzdem fortgesetzt:`, err);
  }
}

/** Behält nur die neuesten `MAX_AUTO_SNAPSHOTS` Auto-Snapshots (nach Dateiname/Zeitstempel sortiert). */
async function pruneOldSnapshots(): Promise<void> {
  const entries = await fs.readdir(BACKUP_DIR);
  const autoSnapshots = entries.filter((f) => f.startsWith("auto-") && f.endsWith(".json")).sort();

  const excess = autoSnapshots.length - MAX_AUTO_SNAPSHOTS;
  if (excess <= 0) return;

  const toDelete = autoSnapshots.slice(0, excess);
  await Promise.all(toDelete.map((f) => fs.unlink(path.join(BACKUP_DIR, f)).catch(() => {})));
}

// -----------------------------------------------------------------------------
// Periodisches Backup (unabhängig von destruktiven Aktionen)
// -----------------------------------------------------------------------------
// Wird vom Hintergrund-Scheduler (src/lib/scheduler.ts) bei jedem Tick
// aufgerufen — legt aber höchstens alle `PERIODIC_INTERVAL_MS` tatsächlich
// einen neuen Snapshot an, statt bei jedem 15-Minuten-Tick. Teilt sich mit
// den destruktiven Auto-Snapshots dieselbe Rotation (`pruneOldSnapshots()`,
// `MAX_AUTO_SNAPSHOTS`), damit es nicht zwei unabhängige Aufbewahrungs-Töpfe
// gibt. Existiert absichtlich ohne eigenes Preferences-Feld/Schema-Änderung
// — der Zeitstempel der zuletzt geschriebenen Datei im Dateisystem selbst
// reicht als "letzter Lauf war am..."-Information.
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
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const entries = await fs.readdir(BACKUP_DIR);
    const periodicSnapshots = entries
      .filter((f) => f.startsWith("auto-") && f.endsWith(`-${PERIODIC_LABEL}.json`))
      .sort();
    const newest = periodicSnapshots[periodicSnapshots.length - 1];

    if (newest) {
      const stats = await fs.stat(path.join(BACKUP_DIR, newest));
      if (Date.now() - stats.mtimeMs < PERIODIC_INTERVAL_MS) return; // noch aktuell genug
    }

    await createAutoSnapshot(PERIODIC_LABEL);
  } catch (err) {
    console.warn("serverBackupRotation: Periodischer Snapshot-Check fehlgeschlagen:", err);
  }
}
