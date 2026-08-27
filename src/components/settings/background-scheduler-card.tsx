"use client";

// -----------------------------------------------------------------------------
// Toggle für den in-process Hintergrund-Scheduler (src/lib/scheduler.ts):
// synct bei aktiviertem IMAP periodisch neue E-Mails und verschickt fällige
// Push-Benachrichtigungen, solange der Server läuft. Standardmäßig aktiv.
// -----------------------------------------------------------------------------
import { useState } from "react";
import { useSWRConfig } from "swr";
import { Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiPatch } from "@/lib/api";
import type { PreferencesPublic } from "@/types";

export function BackgroundSchedulerCard({ preferences }: { preferences: PreferencesPublic }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(preferences.backgroundSchedulerEnabled ?? true);

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
      </CardContent>
    </Card>
  );
}
