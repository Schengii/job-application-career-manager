import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Standard-Umgebung für Lib-/API-Tests bleibt "node" (schneller, kein
    // DOM nötig). Komponenten-Tests (`src/components/**/*.test.tsx`) stellen
    // per `// @vitest-environment jsdom`-Kommentar am Dateianfang selbst auf
    // jsdom um (Vitest unterstützt Umgebungs-Overrides pro Datei).
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Registriert @testing-library/jest-dom-Matcher (toBeInTheDocument, ...)
    // und automatisches Unmounting nach jedem Test global — unschädlich für
    // Lib-/API-Tests, die keine Komponenten rendern (siehe setupTests.ts).
    setupFiles: ["./src/test/setupTests.ts"],
    // API-Integrationstests laufen sequenziell, damit sie sich nicht
    // gegenseitig in der Testdatenbank stören.
    fileParallelism: false,
    globalSetup: ["./vitest.global-setup.ts"],
    env: {
      // Für lokale Tests: TEST_DATABASE_URL in .env.test setzen,
      // z.B. eine separate Neon-Branch oder lokale Postgres-Instanz.
      // Fallback auf DATABASE_URL (wird dann force-reset).
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
