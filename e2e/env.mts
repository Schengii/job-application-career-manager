// -----------------------------------------------------------------------------
// Gemeinsame Konstanten für die E2E-Testumgebung — von playwright.config.mts
// (Port/DB-URL für den webServer) UND e2e/global-setup.mts genutzt.
// -----------------------------------------------------------------------------

/**
 * PostgreSQL-Verbindungs-URL für E2E-Tests.
 * Nutzt DATABASE_URL aus der Umgebung (z.B. eine separate Neon-Branch
 * oder eine lokale Postgres-Instanz). Muss vor dem Testlauf gesetzt sein.
 */
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

// Eigener Port, damit `npx playwright test` nicht mit einem parallel
// laufenden `npm run dev` (Port 3000) auf derselben Maschine kollidiert.
export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
