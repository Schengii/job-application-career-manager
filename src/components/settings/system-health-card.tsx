"use client";

import useSWR from "swr";
import { Activity, CheckCircle2, AlertCircle, XCircle, RefreshCw, Database, Bell, Bot, CalendarClock } from "lucide-react";
import { fetcher } from "@/lib/core/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HealthCheckResult } from "@/app/api/health/route";

export function SystemHealthCard() {
  const { data: health, isLoading, mutate } = useSWR<HealthCheckResult>("/api/health", fetcher);

  const statusColor =
    health?.status === "ok" ? "green" : health?.status === "degraded" ? "amber" : "red";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">System-Diagnose & Status</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {health && (
            <Badge color={statusColor}>
              {health.status === "ok" ? "Alle Systeme betriebsbereit" : health.status === "degraded" ? "Eingeschränkt" : "Systemfehler"}
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={() => mutate()} disabled={isLoading} className="h-8">
            <RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Prüfen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-xs text-muted-foreground">
          Überprüfe die Funktionsfähigkeit deiner lokalen SQLite-Datenbank, Push-Dienste, KI-Provider und Hintergrund-Dienste.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* SQLite Datenbank */}
          <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-surface">
            <Database className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">SQLite (better-sqlite3)</span>
                {health?.database.connected ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> WAL aktiv
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-rose-500">
                    <XCircle className="h-3.5 w-3.5" /> Fehler
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {health?.database.connected ? "5000ms Timeout, synchrones Journal" : health?.database.error ?? "Nicht erreichbar"}
              </p>
            </div>
          </div>

          {/* Web Push */}
          <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-surface">
            <Bell className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Web-Push (VAPID)</span>
                {health?.pushNotifications.vapidConfigured ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Konfiguriert
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-500">
                    <AlertCircle className="h-3.5 w-3.5" /> Nicht aktiv
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                VAPID-Schlüsselpaar für Browser-Push-Benachrichtigungen
              </p>
            </div>
          </div>

          {/* KI-Provider */}
          <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-surface">
            <Bot className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">KI-Provider</span>
                {health?.aiProvider.configured ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {health.aiProvider.provider?.toUpperCase()}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    Offline-Heuristik
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Modell: {health?.aiProvider.model || "Lokale Heuristik (kein Key nötig)"}
              </p>
            </div>
          </div>

          {/* Scheduler */}
          <div className="flex items-start gap-3 rounded-lg border border-border p-3 bg-surface">
            <CalendarClock className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">In-Process Scheduler</span>
                {health?.scheduler.enabled ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 15-Min-Takt
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    Deaktiviert
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {health?.scheduler.lastErrorMessage ? (
                  <span className="text-rose-500">Fehler: {health.scheduler.lastErrorMessage}</span>
                ) : (
                  "Automatische Erinnerungen & IMAP-Sync"
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
