// -----------------------------------------------------------------------------
// Vitest Global Setup — einmalig vor der gesamten Testsuite ausgeführt.
// -----------------------------------------------------------------------------
// Erstellt eine dedizierte SQLite-Testdatenbank (getrennt von `dev.db`) und
// wendet das aktuelle Schema darauf an, damit die Integrationstests unter
// `src/app/api/**/*.test.ts` gegen eine echte, saubere Datenbank statt gegen
// die persönliche Entwicklungs-DB laufen.
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
// Hinweis: `prisma/migrations/` ist derzeit NICHT vollständig (mehrere
// Spalten/Tabellen aus schema.prisma fehlen dort, vermutlich weil das
// Projekt laut README per `prisma db push` statt `prisma migrate dev`
// entwickelt wurde). `prisma/test-schema.sql` umgeht dieses Problem, indem es
// direkt aus dem aktuellen Schema erzeugt wird. Bei einer künftigen
// Schema-Änderung muss die Datei über obigen Befehl neu generiert werden
// (die Testsuite validiert das nicht automatisch).
// -----------------------------------------------------------------------------
import Database from "better-sqlite3";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const TEST_DB_PATH = path.resolve(import.meta.dirname, "prisma/test.db");
const SCHEMA_SQL_PATH = path.resolve(import.meta.dirname, "prisma/test-schema.sql");
export const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

export default function setup() {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = `${TEST_DB_PATH}${suffix}`;
    if (existsSync(file)) rmSync(file);
  }

  const db = new Database(TEST_DB_PATH);
  try {
    db.exec(readFileSync(SCHEMA_SQL_PATH, "utf-8"));
  } finally {
    db.close();
  }
}
