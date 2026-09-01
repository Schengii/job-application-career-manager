// -----------------------------------------------------------------------------
// Geteilte Hilfsfunktion: legt eine frische SQLite-Datenbank aus dem aktuellen
// Prisma-Schema an.
// -----------------------------------------------------------------------------
// Genutzt von zwei Stellen, die je eine eigene, isolierte DB brauchen statt
// der persönlichen Entwicklungsdatenbank (`dev.db`):
//  - vitest.global-setup.ts  -> prisma/test.db  (API-Integrationstests)
//  - e2e/global-setup.mts    -> prisma/e2e.db   (Playwright-E2E-Tests)
// Unterschiedliche Pfade, damit sich Vitest- und Playwright-Läufe nicht
// gegenseitig überschreiben, falls sie (z. B. lokal) gleichzeitig laufen.
//
// Bewusst KEIN `prisma db push`/`migrate` CLI-Aufruf gegen eine echte
// Datenbank: Diese Kommandos lösen Prisma Migrate's Schutzmechanismus gegen
// KI-Agenten aus ("Prisma Migrate detected that it was invoked by Claude
// Code"), der ohne explizite Nutzer-Zustimmung PRO Aufruf blockiert — eine im
// Repo fest hinterlegte Zustimmung würde diesen Schutz für alle zukünftigen
// Testläufe dauerhaft aushebeln. Stattdessen wird `prisma/test-schema.sql`
// (ein reines SQL-Skript, erzeugt via `prisma migrate diff --from-empty
// --to-schema prisma/schema.prisma --script` — ein rein lesender Datei-Diff
// ohne Datenbankzugriff, daher unproblematisch) direkt per `better-sqlite3`
// ausgeführt.
//
// Hinweis: Bei einer Schema-Änderung muss `prisma/test-schema.sql` über
// obigen Befehl neu generiert werden (`npm run test:db:regenerate`) — weder
// diese Funktion noch ihre beiden Aufrufer validieren das automatisch.
// -----------------------------------------------------------------------------
import Database from "better-sqlite3";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const DEFAULT_SCHEMA_SQL_PATH = path.resolve(import.meta.dirname, "../../prisma/test-schema.sql");

/**
 * Löscht eine ggf. vorhandene SQLite-Datei (inkl. WAL-/Journal-Nebendateien)
 * an `dbPath` und wendet das aktuelle Prisma-Schema frisch darauf an.
 *
 * Windows-Besonderheit: Playwright startet den `webServer`-Plugin-Hook VOR
 * dem hier aufrufenden `globalSetup` (Plugin-Setup läuft in
 * `createGlobalSetupTasks` vor dem User-`globalSetup`-Task) — der Next.js
 * Dev-Server kann die DB-Datei also bereits geöffnet haben, BEVOR wir hier
 * ankommen (u.a. durch den sofortigen Scheduler-Tick beim Serverstart, siehe
 * `runSchedulerTick()` in src/lib/scheduler.ts). Ein offener Handle verbietet
 * unter Windows das Löschen der Datei (EPERM), anders als unter Linux/macOS
 * (dort funktioniert `rmSync` auf offenen Dateien anstandslos, daher fällt
 * das dort nie auf). Statt die Datei zu löschen, wird sie deshalb — falls sie
 * schon existiert — über eine eigene Verbindung geleert (alle Tabellen
 * `DROP`en) statt neu angelegt; das kommt ohne Löschrecht auf einen fremden
 * Handle aus.
 */
export function resetSqliteDatabase(dbPath: string, schemaSqlPath: string = DEFAULT_SCHEMA_SQL_PATH): void {
  for (const suffix of ["-journal", "-wal", "-shm"]) {
    const file = `${dbPath}${suffix}`;
    if (existsSync(file)) {
      try {
        rmSync(file);
      } catch {
        // Von einem parallel gestarteten Prozess (s. Kommentar oben) offen
        // gehalten — unschädlich, wird beim gleich folgenden Schema-Reset
        // der Hauptdatei ohnehin verworfen/neu geschrieben.
      }
    }
  }

  let db: Database.Database;
  try {
    rmSync(dbPath);
    db = new Database(dbPath);
  } catch {
    // Datei existiert bereits und ist (unter Windows) von einem anderen
    // Prozess offen -> stattdessen bestehende Verbindung nutzen und alle
    // Tabellen droppen, statt die Datei zu ersetzen.
    db = new Database(dbPath);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];
    for (const { name } of tables) {
      db.exec(`DROP TABLE IF EXISTS "${name}"`);
    }
  }

  try {
    db.exec(readFileSync(schemaSqlPath, "utf-8"));
  } finally {
    db.close();
  }
}
