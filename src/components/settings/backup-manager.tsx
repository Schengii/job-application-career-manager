"use client";

// -----------------------------------------------------------------------------
// Backup- & Rotations-Manager (Lokale Snapshots & JSON Import/Export)
// -----------------------------------------------------------------------------
import { useRef, useState } from "react";
import { useSWRConfig } from "swr";
import {
  Download,
  Upload,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  History,
  Trash2,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api";
import {
  saveRotatedBackup,
  getRotatedBackups,
  deleteRotatedBackup,
  formatBackupSize,
  type RotatedBackupEntry,
} from "@/lib/backupRotation";
import type { BackupData } from "@/lib/backup";

export function BackupManager() {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [restoreStats, setRestoreStats] = useState<Record<string, number> | null>(null);
  const [snapshots, setSnapshots] = useState<RotatedBackupEntry[]>(() => getRotatedBackups());

  async function refreshAllData() {
    await Promise.all([
      mutate("/api/applications"),
      mutate("/api/companies"),
      mutate("/api/jobs"),
      mutate("/api/documents"),
      mutate("/api/preferences"),
      mutate("/api/metrics"),
      mutate("/api/analytics"),
    ]);
  }

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

  async function handleCreateSnapshot() {
    setCreatingSnapshot(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Snapshot-Erstellung fehlgeschlagen");
      const data: BackupData = await res.json();
      const updated = saveRotatedBackup(data);
      setSnapshots(updated);
      toast.success("Neuer lokaler Snapshot erfolgreich erstellt!");
    } catch {
      toast.error("Fehler beim Erstellen des Snapshots.");
    } finally {
      setCreatingSnapshot(false);
    }
  }

  async function handleRestoreFromData(data: BackupData, label?: string) {
    if (
      !confirm(
        `Möchtest du den Datenstand „${label || "Backup"}“ wirklich einspielen? Alle aktuellen Tabellen werden synchronisiert.`
      )
    ) {
      return;
    }

    setRestoring(true);
    setRestoreStats(null);
    try {
      const result = await apiPost<{ success: boolean; stats: Record<string, number> }>(
        "/api/backup",
        data
      );
      setRestoreStats(result.stats);
      await refreshAllData();
      toast.success("Datenbank erfolgreich wiederhergestellt!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wiederherstellung fehlgeschlagen.");
    } finally {
      setRestoring(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json: BackupData = JSON.parse(text);
      await handleRestoreFromData(json, file.name);
    } catch {
      toast.error("Ungültige JSON-Backup-Datei.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDeleteSnapshot(id: string) {
    const updated = deleteRotatedBackup(id);
    setSnapshots(updated);
    toast.success("Snapshot gelöscht.");
  }

  function handleDownloadSnapshot(entry: RotatedBackupEntry) {
    const blob = new Blob([JSON.stringify(entry.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapshot-${entry.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Snapshots & Rotations-Manager */}
      <Card className="border-primary/20 bg-surface">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                Rotierende Snapshots & Revisions-Verlauf
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Schnelle 1-Klick-Sicherungen im Browser speichern und jederzeit wiederherstellen (bis zu 5 Stände)
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleCreateSnapshot}
            disabled={creatingSnapshot}
            className="card-hover-effect"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span>{creatingSnapshot ? "Erstelle Snapshot …" : "Jetzt Snapshot anlegen"}</span>
          </Button>
        </CardHeader>

        <CardContent className="pt-2 space-y-3">
          {snapshots.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
              Noch keine Snapshots hinterlegt. Klicke auf „Jetzt Snapshot anlegen“, um deinen ersten Sicherungspunkt zu speichern.
            </p>
          )}

          {snapshots.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-hover/30 p-3 text-xs transition-colors hover:bg-surface-hover/60"
            >
              <div className="space-y-0.5 min-w-0 flex-1">
                <p className="font-bold text-foreground truncate">{s.label}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>Größe: {formatBackupSize(s.sizeBytes)}</span>
                  <span>Zeit: {new Date(s.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestoreFromData(s.data, s.label)}
                  disabled={restoring}
                  className="h-7 text-[11px] card-hover-effect"
                >
                  <RotateCcw className="h-3 w-3 text-primary" /> Wiederherstellen
                </Button>

                <button
                  type="button"
                  onClick={() => handleDownloadSnapshot(s)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  title="JSON herunterladen"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteSnapshot(s.id)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  title="Snapshot löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 2. Datei-Export & Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Manuelle JSON-Sicherung
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Lädt alle Daten als eigenständige JSON-Datei auf deinen Computer herunter.
            </p>
            <Button onClick={handleExport} disabled={exporting} size="sm" className="card-hover-effect">
              <Download className="h-4 w-4" /> {exporting ? "Erstelle Datei …" : "Backup-JSON herunterladen"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-warning">
              <AlertTriangle className="h-4 w-4" /> Wiederherstellung aus Datei
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Importiert eine zuvor exportierte `.json`-Sicherungsdatei von deiner Festplatte.
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
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={restoring}
                className="card-hover-effect"
              >
                {restoring ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Spiele ein …
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" /> Datei auswählen & einspielen
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {restoreStats && (
        <div className="rounded-lg border border-success/30 bg-success-soft/30 p-4 text-xs animate-fade-in">
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
    </div>
  );
}
