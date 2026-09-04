"use client";

// -----------------------------------------------------------------------------
// Toggle für den in-process Hintergrund-Scheduler (src/lib/scheduler.ts):
// synct bei aktiviertem IMAP periodisch neue E-Mails und verschickt fällige
// Push-Benachrichtigungen, solange der Server läuft. Standardmäßig aktiv.
// -----------------------------------------------------------------------------
import { useState } from "react";
import { useSWRConfig } from "swr";
import { Clock, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiPatch } from "@/lib/core/api";
import type { PreferencesPublic } from "@/types";

const ERROR_SOURCE_LABELS: Record<string, string> = {
  email_sync: "E-Mail-Sync (IMAP)",
  push: "Push-Benachrichtigungen",
  backup: "automatisches Backup",
  digest: "Wöchentlicher Erinnerungs-Digest",
};

export function BackgroundSchedulerCard({ preferences }: { preferences: PreferencesPublic }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(preferences.backgroundSchedulerEnabled ?? true);
  const [digestSaving, setDigestSaving] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(preferences.digestEnabled ?? true);

  async function handleToggle(checked: boolean) {
    setEnabled(checked);
    setSaving(true);
    try {
      await apiPatch("/api/preferences", { backgroundSchedulerEnabled: checked });
      await mutate("/api/preferences");
      toast.success(checked ? "Hintergrund-Automatisierung aktiviert." : "Hintergrund-Automatisierung deaktiviert.");
    } catch {
      setEnabled(!checked);
      toast.error("Konnte Einstellung nicht speichern.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDigestToggle(checked: boolean) {
    setDigestEnabled(checked);
    setDigestSaving(true);
    try {
      await apiPatch("/api/preferences", { digestEnabled: checked });
      await mutate("/api/preferences");
      toast.success(checked ? "Wöchentlicher Digest aktiviert." : "Wöchentlicher Digest deaktiviert.");
    } catch {
      setDigestEnabled(!checked);
      toast.error("Konnte Einstellung nicht speichern.");
    } finally {
      setDigestSaving(false);
    }
  }

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" /> Hintergrund-Automatisierung
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Läuft alle 15 Minuten automatisch im Hintergrund, solange der Server aktiv ist: synct bei aktiviertem
          E-Mail Auto-Sync neue Nachrichten und prüft auf fällige Termine/Rückmeldungen für Push-Benachrichtigungen.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="scheduler-enabled"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-border text-primary"
          />
          <label htmlFor="scheduler-enabled" className="text-sm font-semibold text-foreground cursor-pointer">
            Automatisch im Hintergrund aktiv halten
          </label>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="digest-enabled"
            checked={digestEnabled}
            onChange={(e) => handleDigestToggle(e.target.checked)}
            disabled={digestSaving}
            className="h-4 w-4 rounded border-border text-primary"
          />
          <label htmlFor="digest-enabled" className="text-sm font-semibold text-foreground cursor-pointer">
            Wöchentlichen Erinnerungs-Digest per Push senden
          </label>
          {digestSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Eine einzelne, zusammenfassende Push-Benachrichtigung pro Woche über überfällige Termine, anstehende
          Gespräche und empfohlene Nachfassaktionen — ergänzend zu den sofortigen Einzelbenachrichtigungen.
        </p>

        {preferences.lastSchedulerErrorMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">
                Letzter Hintergrundlauf fehlgeschlagen:{" "}
                {ERROR_SOURCE_LABELS[preferences.lastSchedulerErrorSource ?? ""] ?? preferences.lastSchedulerErrorSource}
              </p>
              <p className="mt-0.5 break-words text-amber-700/80 dark:text-amber-400/80">
                {preferences.lastSchedulerErrorMessage}
              </p>
              {preferences.lastSchedulerErrorAt && (
                <p className="mt-0.5 text-[11px] text-amber-700/60 dark:text-amber-400/60">
                  {new Date(preferences.lastSchedulerErrorAt).toLocaleString("de-DE")}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
