"use client";

// -----------------------------------------------------------------------------
// Multi-Portal Synchronisations-Banner & Auto-Sync-Controller
// -----------------------------------------------------------------------------
import { useState } from "react";
import {
  Globe2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/core/api";
import { SUPPORTED_PORTALS } from "@/lib/jobs/mockJobPortals";
import type { JobPostingWithCompany } from "@/types";

interface SyncResponse {
  success: boolean;
  createdCount: number;
  totalJobsCount: number;
  syncedPortalsCount: number;
  lastSyncedAt: string;
}

export function MultiPortalSyncBanner({
  jobs,
  onSyncComplete,
}: {
  jobs: JobPostingWithCompany[];
  onSyncComplete: () => Promise<unknown>;
}) {
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const val = localStorage.getItem("career_job_auto_sync");
      return val !== null ? JSON.parse(val) : true;
    } catch {
      return true;
    }
  });

  const [lastSyncText, setLastSyncText] = useState<string>("Live synchronisiert");

  // Toggle Auto-Sync
  function handleToggleAutoSync() {
    const next = !autoSync;
    setAutoSync(next);
    try {
      localStorage.setItem("career_job_auto_sync", JSON.stringify(next));
    } catch {
      // Ignore
    }
    toast.success(
      next
        ? "Automatische Live-Aktualisierung aktiviert."
        : "Automatische Live-Aktualisierung deaktiviert."
    );
  }

  // Manuelle oder automatische Synchronisation
  async function handleSyncAll(isAuto = false) {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await apiPost<SyncResponse>("/api/jobs/sync", {});
      await onSyncComplete();
      const timeStr = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      setLastSyncText(`Heute um ${timeStr} Uhr`);

      if (!isAuto) {
        if (res.createdCount > 0) {
          toast.success(
            `🚀 ${res.createdCount} neue Stellenangebote von allen ${res.syncedPortalsCount} Jobportalen geladen!`
          );
        } else {
          toast.success(
            `Alle ${res.syncedPortalsCount} Jobportale sind aktuell. Keine neuen Duplikate gefunden.`
          );
        }
      }
    } catch {
      if (!isAuto) toast.error("Fehler beim Synchronisieren der Jobportale.");
    } finally {
      setSyncing(false);
    }
  }

  // Berechne Portal-Statistiken
  const portalCounts = SUPPORTED_PORTALS.map((portal) => {
    const count = jobs.filter((j) => j.portalSource === portal.id).length;
    return { ...portal, count };
  });

  return (
    <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-surface to-primary/5 p-4 md:p-5 glass-card shadow-xs animate-scale-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Titel & Status */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Globe2 className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-foreground">
              Multi-Portal Live-Synchronisation
            </h2>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {SUPPORTED_PORTALS.length} Portale aktiv
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Aggregiert kontinuierlich offene Frontend-, React-, Next.js- und Fachinformatiker-Stellen
            aus StepStone, Indeed, Get in IT, LinkedIn, XING, Arbeitsagentur u. v. m.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Auto-Sync Toggle */}
          <button
            type="button"
            onClick={handleToggleAutoSync}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              autoSync
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                : "border-border bg-surface text-muted-foreground hover:bg-surface-hover"
            }`}
            title="Automatische Aktualisierung bei Seitenaufruf"
          >
            <Zap className={`h-3.5 w-3.5 ${autoSync ? "text-primary" : "text-muted-foreground"}`} />
            <span>Auto-Sync: {autoSync ? "Aktiv" : "Aus"}</span>
          </button>

          {/* Sync All Button */}
          <Button
            onClick={() => handleSyncAll(false)}
            disabled={syncing}
            className="card-hover-effect font-medium"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin text-white" : "text-white"}`} />
            <span>{syncing ? "Synchronisiere alle Portale …" : "Jetzt alle Portale abgleichen"}</span>
          </Button>
        </div>
      </div>

      {/* Portale Übersicht Chips */}
      <div className="mt-4 pt-3.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-primary" /> Portale:
          </span>
          {portalCounts.map((portal) => (
            <div
              key={portal.id}
              className="flex items-center gap-1.5 rounded-md border border-border bg-surface/80 px-2 py-0.5 text-[11px] text-foreground"
            >
              <span className="font-medium">{portal.name}</span>
              <span className="rounded bg-surface-hover px-1 py-0.2 text-[10px] font-bold text-muted-foreground">
                {portal.count}
              </span>
            </div>
          ))}
        </div>

        <span className="text-[11px] text-muted-foreground">
          Status: <strong className="text-foreground">{lastSyncText}</strong>
        </span>
      </div>
    </div>
  );
}
