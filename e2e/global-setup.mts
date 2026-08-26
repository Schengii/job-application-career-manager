// -----------------------------------------------------------------------------
// Playwright Global Setup — einmalig vor der gesamten E2E-Suite ausgeführt
// (siehe playwright.config.mts -> globalSetup).
// -----------------------------------------------------------------------------
// Legt `prisma/e2e.db` frisch aus dem aktuellen Prisma-Schema an, BEVOR der
// Next.js-Dev-Server (playwright.config.mts -> webServer) startet und darauf
// zugreift. So laufen die E2E-Tests gegen eine echte, aber garantiert leere
// Datenbank statt gegen die persönliche dev.db.
// -----------------------------------------------------------------------------
import { resetSqliteDatabase } from "../src/test/sqliteTestDb.mts";
import { E2E_DB_PATH } from "./env.mts";

export default function globalSetup() {
  resetSqliteDatabase(E2E_DB_PATH);
}
