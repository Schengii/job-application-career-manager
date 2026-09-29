// -----------------------------------------------------------------------------
// Playwright E2E-Konfiguration
// -----------------------------------------------------------------------------
// Startet den Next.js-Dev-Server selbst (statt gegen einen Produktions-Build
// zu testen, wie es die Next.js-Doku für maximale Praxisnähe empfiehlt) —
// bewusst der pragmatischere Kompromiss für dieses Projekt: kein zusätzlicher
// `next build`-Schritt vor jedem lokalen Testlauf, konsistent mit den
// Vitest-Integrationstests, die ebenfalls ohne Build laufen. Die separate
// `npm run build` in ci.yml deckt die Produktions-Build-Fähigkeit weiterhin ab.
//
// Läuft bewusst NUR gegen Chromium: Diese App hat keine browserspezifischen
// Features (kein WebKit-/Firefox-only-Verhalten außer der ohnehin nur
// progressiv genutzten Web-Speech-API in der Interview-Simulation), daher
// steht der 3-fache Laufzeit-/Wartungsaufwand für Firefox+WebKit in keinem
// Verhältnis zum Nutzen für ein Einzelnutzer-Portfolio-Projekt.
//
// `fullyParallel: false` + `workers: 1`: Alle Tests teilen sich dieselbe
// Testdatenbank ohne Transaktions-Rollback pro Test — parallele Worker
// würden sich mit Race-Conditions blockieren.
// -----------------------------------------------------------------------------
import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_DATABASE_URL, E2E_PORT } from "./e2e/env.mts";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.mts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  // Next.js Dev-Server + Turbopack kompiliert jede Route beim ersten Besuch
  // on-demand — großzügigere Timeouts als der Playwright-Default federn den
  // ersten (kalten) Seitenaufruf pro Route ab, ohne Tests künstlich zu verlangsamen.
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: E2E_BASE_URL,
    trace: "on-first-retry",
    navigationTimeout: 20_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.E2E_DATABASE_URL ?? E2E_DATABASE_URL,
      // Leerer String statt "undefined lassen": überschreibt deterministisch
      // ein eventuell in der Host-Umgebung gesetztes APP_PASSWORD, damit die
      // Tests nie unerwartet auf HTTP-Basic-Auth treffen (middleware.ts
      // behandelt einen leeren String wie "nicht gesetzt").
      APP_PASSWORD: "",
    },
  },
});
