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
import { timingSafeEqual } from "node:crypto";
import { runSchedulerTick } from "@/lib/settings/scheduler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const isVercel = !!process.env.VERCEL;

  if (!cronSecret) {
    // Auf Vercel muss CRON_SECRET gesetzt sein — ohne Secret fail-closed.
    if (isVercel) {
      console.error("cron/tick: CRON_SECRET ist nicht konfiguriert.");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    // Lokal ohne Secret: Endpunkt ohne Auth erreichbar (Dev-Convenience).
  } else {
    const authHeader = request.headers.get("authorization") ?? "";
    const expected = `Bearer ${cronSecret}`;
    // Timing-sicherer Vergleich verhindert Timing-Angriffe auf den Secret.
    const valid =
      authHeader.length === expected.length &&
      timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await runSchedulerTick();
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("cron/tick: Scheduler-Tick fehlgeschlagen.", error);
    return NextResponse.json({ error: "Scheduler-Tick fehlgeschlagen" }, { status: 500 });
  }
}
