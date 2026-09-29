// -----------------------------------------------------------------------------
// Test-Datenbankhelfer — PostgreSQL (Neon / lokales Postgres)
// -----------------------------------------------------------------------------
// Früher SQLite-spezifisch; seit der Migration zu PostgreSQL/Neon wird für
// Tests eine echte Postgres-Datenbank erwartet. Die DATABASE_URL für Tests
// wird über die Umgebungsvariable TEST_DATABASE_URL bzw. DATABASE_URL gesetzt.
//
// Die Funktion `resetTestDatabase` löscht alle Tabellen und wendet das Schema
// über `prisma db push --force-reset` neu an. Sie wird von:
//  - vitest.global-setup.ts  (API-Integrationstests)
//  - e2e/global-setup.mts    (Playwright-E2E-Tests)
// aufgerufen.
// -----------------------------------------------------------------------------

// Platzhalter – bei PostgreSQL übernimmt `prisma db push --force-reset` das
// Schema-Setup; ein programmatisches Reset via better-sqlite3 entfällt.
// Die eigentliche Logik liegt jetzt in den jeweiligen global-setup-Dateien.
export function resetSqliteDatabase(_dbPath: string): void {
  // Kein-Op: Wird für Abwärtskompatibilität der Importstellen beibehalten.
  // Das Schema-Reset für Postgres erfolgt über `prisma db push` (siehe
  // vitest.global-setup.ts / e2e/global-setup.mts).
}
