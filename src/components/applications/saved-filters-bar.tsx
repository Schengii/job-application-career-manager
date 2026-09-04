"use client";

// -----------------------------------------------------------------------------
// Gespeicherte Filter/Ansichten: Pill-Leiste zum Anwenden gespeicherter
// Filterkombinationen, plus Button zum Speichern der aktuell aktiven Filter
// unter einem selbst gewählten Namen. Wird sowohl in der klassischen
// Tabellenansicht (src/app/applications/page.tsx) als auch in der
// Excel-Ansicht (src/components/excel/excel-grid-table.tsx) eingebunden.
// Persistenz via localStorage, s. src/lib/savedFilters.ts.
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Bookmark, Plus, X } from "lucide-react";
import { cn } from "@/lib/core/utils";
import { useToast } from "@/components/ui/toast";
import {
  deleteFilterPreset,
  getSavedFilters,
  saveFilterPreset,
  type SavedFilterPreset,
  type SavedFilterValues,
} from "@/lib/applications/savedFilters";

export function SavedFiltersBar({
  currentFilters,
  onApply,
}: {
  /** Aktuell in der Toolbar aktive Filterkombination — wird beim Speichern übernommen. */
  currentFilters: SavedFilterValues;
  /** Setzt die Filter-States der Elternansicht auf die eines angewendeten Presets. */
  onApply: (filters: SavedFilterValues) => void;
}) {
  const toast = useToast();
  // Lazy-Initializer statt Effect (analog zu `visibleCols` in
  // excel-grid-table.tsx und `snapshots` in backup-manager.tsx) — ohne die
  // zusätzliche Render-Kaskade eines `useEffect`-Aufrufs (von der Projekt-
  // ESLint-Regel `react-hooks/set-state-in-effect` ohnehin untersagt).
  // Trade-off: Da `getSavedFilters()` beim serverseitigen Vorrendern mangels
  // `localStorage` immer `[]` liefert, weicht der erste Client-Render von der
  // SSR-Ausgabe ab, sobald der Browser bereits gespeicherte Ansichten hat
  // (harmlose React-Hydration-Mismatch-Warnung in der Konsole, kein
  // funktionaler Fehler — React verwirft den SSR-Baum an dieser Stelle und
  // rendert clientseitig neu) — derselbe bewusst in Kauf genommene Trade-off
  // wie beim bestehenden `snapshots`-State in backup-manager.tsx.
  const [presets, setPresets] = useState<SavedFilterPreset[]>(() => getSavedFilters());
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = saveFilterPreset(trimmed, currentFilters);
    setPresets(updated);
    setName("");
    setNaming(false);
    toast.success(`Ansicht "${trimmed}" gespeichert.`);
  }

  function handleDelete(preset: SavedFilterPreset) {
    if (!confirm(`Gespeicherte Ansicht "${preset.name}" wirklich löschen?`)) return;
    setPresets(deleteFilterPreset(preset.id));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((preset) => (
            <span
              key={preset.id}
              className="group flex items-center gap-1 rounded-full border border-border bg-surface pl-2.5 pr-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <button
                type="button"
                onClick={() => onApply(preset.filters)}
                className="flex items-center gap-1"
                title={`Ansicht "${preset.name}" anwenden`}
              >
                <Bookmark className="h-3 w-3" />
                {preset.name}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(preset)}
                className="rounded-full p-0.5 text-muted-foreground opacity-60 hover:bg-danger/10 hover:text-danger hover:opacity-100"
                title={`Ansicht "${preset.name}" löschen`}
                aria-label={`Ansicht "${preset.name}" löschen`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {naming ? (
        <span className="flex items-center gap-1">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setNaming(false);
                setName("");
              }
            }}
            placeholder="Name der Ansicht …"
            className="h-7 w-36 rounded-full border border-primary bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => {
              setNaming(false);
              setName("");
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Abbrechen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setNaming(true)}
          className={cn(
            "flex h-7 items-center gap-1 rounded-full border border-dashed border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          )}
          title="Aktuelle Filter als Ansicht speichern"
        >
          <Plus className="h-3 w-3" />
          Ansicht speichern
        </button>
      )}
    </div>
  );
}
