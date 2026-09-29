// -----------------------------------------------------------------------------
// Next.js Instrumentation Hook: `register()` läuft einmal beim Start einer
// neuen Server-Instanz (siehe node_modules/next/dist/docs/01-app/02-guides/instrumentation.md).
// Startet den in-process Hintergrund-Scheduler für lokale Entwicklung.
// Auf Vercel übernimmt der Cron Job (/api/cron/tick, vercel.json) diese Aufgabe —
// dort wird der Scheduler hier NICHT gestartet, um doppelte Ausführungen
// in mehreren serverless Function-Instanzen zu vermeiden.
// -----------------------------------------------------------------------------
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.VERCEL) {
    const { startBackgroundScheduler } = await import("./lib/settings/scheduler");
    startBackgroundScheduler();
  }
}
