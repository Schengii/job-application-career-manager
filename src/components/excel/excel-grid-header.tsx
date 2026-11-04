"use client";

// -----------------------------------------------------------------------------
// Kopfbereich der Excel-Tabellenansicht: Titel, Anzahl ungespeicherter Zeilen
// und die Aktionen Import / Neue Zeile / Export / Speichern.
// Ausgelagert aus excel-grid-table.tsx.
// -----------------------------------------------------------------------------
import { Plus, Save, Download, Upload, CheckCircle2, RefreshCw, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  dirtyCount: number;
  saving: boolean;
  saveStatus: "IDLE" | "SAVING" | "SAVED";
  exportingAll: boolean;
  onImport: () => void;
  onAddRow: () => void;
  onExport: () => void;
  onSave: () => void;
};

export function ExcelGridHeader({
  dirtyCount,
  saving,
  saveStatus,
  exportingAll,
  onImport,
  onAddRow,
  onExport,
  onSave,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Tabellen-Schnellerfassung
            {dirtyCount > 0 && (
              <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning animate-pulse-subtle">
                {dirtyCount} ungespeichert
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            Zellen wie in Excel bearbeiten, Filter setzen und Tab/Enter zur Navigation nutzen.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onImport()} className="card-hover-effect">
          <Upload className="h-4 w-4" /> Import (.xlsx/.csv)
        </Button>

        <Button size="sm" variant="outline" onClick={onAddRow} className="card-hover-effect">
          <Plus className="h-4 w-4" /> Neue Zeile
        </Button>

        <Button size="sm" variant="outline" onClick={onExport} disabled={exportingAll} className="card-hover-effect">
          {exportingAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export {exportingAll ? "…" : "(alle)"}
        </Button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={saving || dirtyCount === 0}
          className="card-hover-effect relative"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : saveStatus === "SAVED" ? (
            <CheckCircle2 className="h-4 w-4 text-success-foreground" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? "Speichere …" : saveStatus === "SAVED" ? "Gespeichert" : "Speichern"}</span>
        </Button>
      </div>
    </div>
  );
}
