"use client";

// -----------------------------------------------------------------------------
// Spalten-Konfigurator der Excel-Ansicht (Popover mit Presets und Checkboxen).
// Ausgelagert aus excel-grid-table.tsx.
// -----------------------------------------------------------------------------
import { useState, useRef, useEffect } from "react";
import { Columns, X } from "lucide-react";
import { COLUMN_OPTIONS, type ColumnPreset, type VisibleColumns } from "@/lib/applications/excelGrid";

const PRESET_BUTTONS: { preset: ColumnPreset; label: string }[] = [
  { preset: "ALL", label: "Alle" },
  { preset: "COMPACT", label: "Kompakt" },
  { preset: "CONTACTS", label: "Kontakte" },
];

type Props = {
  visibleCols: VisibleColumns;
  onToggle: (key: keyof VisibleColumns) => void;
  onPreset: (preset: ColumnPreset) => void;
};

export function ExcelColumnPicker({ visibleCols, onToggle, onPreset }: Props) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside schließt das Popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
      >
        <Columns className="h-3.5 w-3.5" />
        <span>Spalten ({Object.values(visibleCols).filter(Boolean).length + 2})</span>
      </button>

      {open && (
        <div className="absolute right-0 top-9.5 z-50 w-64 rounded-xl border border-border bg-surface p-3.5 shadow-xl animate-scale-in glass-card space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">Spalten anpassen</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1">
            {PRESET_BUTTONS.map(({ preset, label }) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onPreset(preset);
                  setOpen(false);
                }}
                className="flex-1 rounded bg-surface-hover py-1 text-[10px] font-semibold text-foreground hover:bg-primary-soft hover:text-primary transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Checkboxen */}
          <div className="space-y-1.5 text-xs">
            {COLUMN_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleCols[key]}
                  onChange={() => onToggle(key)}
                  className="rounded border-border text-primary"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
