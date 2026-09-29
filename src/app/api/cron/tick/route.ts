// -----------------------------------------------------------------------------
// GET /api/cron/tick — Vercel Cron Job Endpunkt
// -----------------------------------------------------------------------------
// Wird von Vercel alle 15 Minuten aufgerufen (siehe vercel.json -> crons).
// Authentifizierung: Vercel setzt den `Authorization`-Header mit dem
// CRON_SECRET, den wir in den Vercel Environment Variables hinterlegen.
// Lokal wird der Tick über instrumentation.ts::startBackgroundScheduler()
// per setInterval ausgelöst und dieser Endpunkt nicht genutzt.
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { runSchedulerTick } from "@/lib/settings/scheduler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Auf Vercel erzwingt das Framework die Header-Prüfung — lokal ist
  // CRON_SECRET nicht gesetzt, daher ist der Endpunkt ohne Auth erreichbar.
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runSchedulerTick();
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("cron/tick: Scheduler-Tick fehlgeschlagen.", error);
    return NextResponse.json({ error: "Scheduler-Tick fehlgeschlagen" }, { status: 500 });
  }
}
