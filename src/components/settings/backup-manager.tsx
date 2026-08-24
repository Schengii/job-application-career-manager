"use client";

// -----------------------------------------------------------------------------
// Backup & Restore Manager
// -----------------------------------------------------------------------------
import { useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { Download, Upload, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";

export function BackupManager() {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreStats, setRestoreStats] = useState<Record<string, number> | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Export fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `career-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Vollständiges Backup wurde heruntergeladen.");
    } catch {
      toast.error("Exportieren fehlgeschlagen.");
    } finally {
      setExporting(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Achtung: Das Einspielen des Backups synchronisiert alle vorhandenen Datensätze mit der Backup-Datei. Fortfahren?")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setRestoring(true);
    setRestoreStats(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = await apiPost<{ success: boolean; stats: Record<string, number> }>("/api/backup", json);

      setRestoreStats(result.stats);
      await Promise.all([
        mutate("/api/applications"),
        mutate("/api/companies"),
        mutate("/api/jobs"),
        mutate("/api/documents"),
        mutate("/api/preferences"),
        mutate("/api/metrics"),
        mutate("/api/analytics"),
      ]);
      toast.success("Datenbank erfolgreich aus Backup wiederhergestellt.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wiederherstellung fehlgeschlagen.");
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Datensicherung & Export
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Erstelle eine vollständige, portable Sicherung aller deiner Daten (Profil, Umschulungsdaten, Projekte,
            Unternehmen, Stellenangebote, Bewerbungen inkl. Historie und Anschreiben).
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4" /> {exporting ? "Erstelle Backup …" : "Backup als JSON herunterladen"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" /> Wiederherstellung aus JSON-Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Lade eine zuvor exportierte JSON-Backup-Datei hoch, um den Zustand wiederherzustellen oder Daten von einem
            anderen Gerät zu importieren.
          </p>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
              id="backup-file-input"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
            >
              {restoring ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Stelle wieder her …
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Backup-Datei auswählen & einspielen
                </>
              )}
            </Button>
          </div>

          {restoreStats && (
            <div className="rounded-lg border border-success/30 bg-success-soft/30 p-4 text-xs">
              <p className="font-semibold text-success mb-1.5">Wiederhergestellte Einträge:</p>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-muted-foreground">
                <li>Bewerbungen: {restoreStats.applications ?? 0}</li>
                <li>Unternehmen: {restoreStats.companies ?? 0}</li>
                <li>Stellenangebote: {restoreStats.jobPostings ?? 0}</li>
                <li>Dokumente: {restoreStats.documents ?? 0}</li>
                <li>Ausbildungseinträge: {restoreStats.educationEntries ?? 0}</li>
                <li>Projekte: {restoreStats.projectEntries ?? 0}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
