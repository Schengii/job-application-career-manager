// -----------------------------------------------------------------------------
// Next.js Instrumentation Hook: `register()` läuft einmal beim Start einer
// neuen Server-Instanz (siehe node_modules/next/dist/docs/01-app/02-guides/instrumentation.md).
// Startet hier den in-process Hintergrund-Scheduler (src/lib/scheduler.ts).
// -----------------------------------------------------------------------------
export async function register() {
  // Nur im Node.js-Runtime starten (nicht in der Edge-Runtime, die z.B.
  // `middleware.ts` verwendet, und die keinen langlebigen Prozess für
  // `setInterval` hat).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackgroundScheduler } = await import("./lib/settings/scheduler");
    startBackgroundScheduler();
  }
}
