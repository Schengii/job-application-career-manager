// -----------------------------------------------------------------------------
// Gemeinsame Konstanten für die E2E-Testumgebung — von playwright.config.mts
// (Port/DB-URL für den webServer) UND e2e/global-setup.mts (DB-Pfad zum
// Zurücksetzen) genutzt, damit beide garantiert denselben Wert verwenden.
// -----------------------------------------------------------------------------
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Eigene SQLite-Datenbank für E2E-Läufe — getrennt von dev.db UND von der Vitest-Testdatenbank (prisma/test.db). */
export const E2E_DB_PATH = path.resolve(REPO_ROOT, "prisma/e2e.db");
export const E2E_DATABASE_URL = `file:${E2E_DB_PATH}`;

// Eigener Port, damit `npx playwright test` nicht mit einem parallel
// laufenden `npm run dev` (Port 3000) auf derselben Maschine kollidiert.
export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
