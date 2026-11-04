"use client";

// -----------------------------------------------------------------------------
// Sichtbare Spalten der Excel-Ansicht, pro Browser in localStorage gemerkt.
// Ausgelagert aus excel-grid-table.tsx.
// -----------------------------------------------------------------------------
import { useState } from "react";
import {
  COLS_STORAGE_KEY,
  COLUMN_PRESETS,
  DEFAULT_COLUMNS,
  type ColumnPreset,
  type VisibleColumns,
} from "@/lib/applications/excelGrid";

function loadColumns(): VisibleColumns {
  if (typeof window === "undefined") return DEFAULT_COLUMNS;
  try {
    const saved = localStorage.getItem(COLS_STORAGE_KEY);
    return saved ? { ...DEFAULT_COLUMNS, ...JSON.parse(saved) } : DEFAULT_COLUMNS;
  } catch {
    return DEFAULT_COLUMNS;
  }
}

function persistColumns(columns: VisibleColumns) {
  try {
    localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify(columns));
  } catch {
    // localStorage kann blockiert/voll sein — die Auswahl gilt dann nur für diese Sitzung.
  }
}

export function useVisibleColumns() {
  const [visibleCols, setVisibleCols] = useState<VisibleColumns>(loadColumns);

  function toggleColumn(key: keyof VisibleColumns) {
    const updated = { ...visibleCols, [key]: !visibleCols[key] };
    setVisibleCols(updated);
    persistColumns(updated);
  }

  function applyColumnPreset(preset: ColumnPreset) {
    const updated = { ...COLUMN_PRESETS[preset] };
    setVisibleCols(updated);
    persistColumns(updated);
  }

  return { visibleCols, toggleColumn, applyColumnPreset };
}
