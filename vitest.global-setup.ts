// -----------------------------------------------------------------------------
// Vitest Global Setup — einmalig vor der gesamten Testsuite ausgeführt.
// -----------------------------------------------------------------------------
// Setzt die Testdatenbank zurück via `prisma db push --force-reset`.
// Erwartet DATABASE_URL als Env-Variable (gesetzt in vitest.config.mts).
// -----------------------------------------------------------------------------
import { execFileSync } from "node:child_process";

export default function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL must be set for tests");
  }
  execFileSync(
    "npx",
    ["prisma", "db", "push", "--force-reset", "--skip-generate", "--accept-data-loss"],
    { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } },
  );
}
