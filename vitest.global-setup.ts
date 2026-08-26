// -----------------------------------------------------------------------------
// Vitest Global Setup — einmalig vor der gesamten Testsuite ausgeführt.
// -----------------------------------------------------------------------------
// Erstellt eine dedizierte SQLite-Testdatenbank (getrennt von `dev.db`) und
// wendet das aktuelle Schema darauf an, damit die Integrationstests unter
// `src/app/api/**/*.test.ts` gegen eine echte, saubere Datenbank statt gegen
// die persönliche Entwicklungs-DB laufen.
//
// Die eigentliche Logik (Datei löschen + Schema-SQL frisch anwenden) lebt in
// `src/test/sqliteTestDb.mts` — geteilt mit `e2e/global-setup.mts`, das
// dieselbe Funktion für eine eigene E2E-Testdatenbank (`prisma/e2e.db`)
// nutzt. Siehe dort für die ausführliche Begründung (u. a. warum bewusst kein
// `prisma db push`/`migrate` CLI-Aufruf). Die `.mts`-Endung ist dort bewusst
// gewählt (statt `.ts`): Ohne `"type": "module"` in package.json behandelt
// Node `.ts`-Dateien als CommonJS, worin das dort genutzte `import.meta.dirname`
// nicht funktioniert — Playwright lädt die Datei über einen echten
// Node-ESM-Loader (im Gegensatz zu Vitest, das sie über seinen eigenen,
// großzügigeren Vite-Transform lädt), daher fällt der Fehler dort auf.
// -----------------------------------------------------------------------------
import path from "node:path";
import { resetSqliteDatabase } from "./src/test/sqliteTestDb.mts";

const TEST_DB_PATH = path.resolve(import.meta.dirname, "prisma/test.db");
export const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

export default function setup() {
  resetSqliteDatabase(TEST_DB_PATH);
}
