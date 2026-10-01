import { NextResponse } from "next/server";
import { prisma } from "@/lib/core/prisma";
import { getVapidPublicKey } from "@/lib/core/vapidKeys";

export type HealthCheckResult = {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  database: {
    connected: boolean;
    error?: string;
  };
  pushNotifications: {
    vapidConfigured: boolean;
  };
  aiProvider: {
    provider: string | null;
    model: string | null;
    configured: boolean;
  };
  scheduler: {
    enabled: boolean;
    lastErrorSource: string | null;
    lastErrorMessage: string | null;
    lastErrorAt: string | null;
  };
};

export async function GET() {
  let dbConnected = false;
  let dbError: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (err) {
    // DB-Fehlermeldung nicht nach außen geben — könnte Host-Namen/Credentials leaken.
    dbError = "Verbindung fehlgeschlagen";
  }

  let vapidConfigured = false;
  try {
    const key = await getVapidPublicKey();
    vapidConfigured = Boolean(key);
  } catch {
    vapidConfigured = false;
  }

  let aiProvider: { provider: string | null; model: string | null; configured: boolean } = {
    provider: null,
    model: null,
    configured: false,
  };

  let scheduler: {
    enabled: boolean;
    lastErrorSource: string | null;
    lastErrorMessage: string | null;
    lastErrorAt: string | null;
  } = {
    enabled: true,
    lastErrorSource: null,
    lastErrorMessage: null,
    lastErrorAt: null,
  };

  if (dbConnected) {
    try {
      const prefs = await prisma.preferences.findUnique({
        where: { id: "default" },
        select: {
          aiProvider: true,
          aiModel: true,
          aiApiKey: true,
          backgroundSchedulerEnabled: true,
          lastSchedulerErrorSource: true,
          lastSchedulerErrorMessage: true,
          lastSchedulerErrorAt: true,
        },
      });

      if (prefs) {
        aiProvider = {
          provider: prefs.aiProvider,
          model: prefs.aiModel,
          configured: prefs.aiProvider === "ollama" ? true : Boolean(prefs.aiApiKey),
        };

        scheduler = {
          enabled: prefs.backgroundSchedulerEnabled,
          lastErrorSource: prefs.lastSchedulerErrorSource,
          // Fehlermeldungen können interne Stack-Traces oder DB-Host-Namen
          // enthalten — nur das Vorhandensein eines Fehlers wird kommuniziert,
          // nicht der Inhalt.
          lastErrorMessage: prefs.lastSchedulerErrorMessage ? "[Fehler vorhanden]" : null,
          lastErrorAt: prefs.lastSchedulerErrorAt?.toISOString() ?? null,
        };
      }
    } catch {
      // Ignorieren falls Tabelle nicht lesbar
    }
  }

  const overallStatus = !dbConnected
    ? "error"
    : scheduler.lastErrorMessage
    ? "degraded"
    : "ok";

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    database: {
      connected: dbConnected,
      ...(dbError ? { error: dbError } : {}),
    },
    pushNotifications: {
      vapidConfigured,
    },
    aiProvider,
    scheduler,
  };

  return NextResponse.json(result, {
    status: overallStatus === "error" ? 503 : 200,
  });
}
