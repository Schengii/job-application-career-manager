import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
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
