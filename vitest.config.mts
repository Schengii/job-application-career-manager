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
    // API-Integrationstests schreiben in eine gemeinsame SQLite-Testdatei
    // (siehe vitest.global-setup.ts). Parallele Test-Worker-Prozesse würden
    // sich dabei gegenseitig mit "database is locked"-Fehlern blockieren,
    // daher laufen alle Testdateien sequenziell in einem Prozess. Die
    // Gesamtsuite ist klein genug (<100 Tests), dass das keinen spürbaren
    // Performance-Nachteil hat.
    fileParallelism: false,
    globalSetup: ["./vitest.global-setup.ts"],
    env: {
      DATABASE_URL: "file:./prisma/test.db",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
