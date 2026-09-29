// -----------------------------------------------------------------------------
// Playwright Global Setup — einmalig vor der gesamten E2E-Suite ausgeführt
// (siehe playwright.config.mts -> globalSetup).
// -----------------------------------------------------------------------------
// Setzt die E2E-Testdatenbank zurück via `prisma db push --force-reset`.
// Die DATABASE_URL wird über playwright.config.mts -> webServer.env gesetzt.
// -----------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { E2E_DATABASE_URL } from "./env.mts";

export default function globalSetup() {
  execFileSync(
    "npx",
    ["prisma", "db", "push", "--force-reset", "--skip-generate", "--accept-data-loss"],
    { stdio: "inherit", env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL } },
  );
}
