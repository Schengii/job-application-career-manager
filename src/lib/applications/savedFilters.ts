// -----------------------------------------------------------------------------
// Gespeicherte Filter-Presets ("Ansichten") für die Bewerbungsliste
// (Tabellen- & Excel-Ansicht, s. src/app/applications/page.tsx bzw.
// src/components/excel/excel-grid-table.tsx).
//
// Persistenz bewusst client-seitig via localStorage (analog zu
// src/lib/backupRotation.ts) statt über ein neues Prisma-Modell: Diese App
// ist Single-User/lokale SQLite-Instanz, Presets sind reines UI-Komfort-
// Feature ohne Bezug zu Domänendaten, und das bestehende `Preferences`-Modell
// (src/lib/preferences.ts) bietet keinen Platz für eine beliebig lange Liste
// benannter Filterkombinationen — ein neues Prisma-Modell + Migration +
// API-Route wäre für diesen Zweck unverhältnismäßiger Mehraufwand.
// -----------------------------------------------------------------------------

/** Deckt die Filterfelder beider Ansichten ab (Excel-Ansicht kennt keinen Tag-Filter). */
export type SavedFilterValues = {
  status: string;
  portal: string;
  tag?: string;
  search: string;
  onlyFollowUps: boolean;
  sortBy: string;
};

export type SavedFilterPreset = {
  id: string;
  name: string;
  createdAt: string; // ISO-String
  filters: SavedFilterValues;
};

const STORAGE_KEY = "career_manager_saved_filters";
const MAX_PRESETS = 20;

export function getSavedFilters(): SavedFilterPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(presets: SavedFilterPreset[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Ignore (z.B. voller localStorage)
  }
}

/**
 * Speichert die aktuelle Filterkombination unter `name`. Existiert bereits
 * ein Preset mit demselben Namen (case-insensitiv), wird es ersetzt statt
 * dupliziert — erleichtert das Aktualisieren einer bestehenden Ansicht.
 * Begrenzt auf MAX_PRESETS Einträge (älteste zuerst verdrängt), analog zur
 * Backup-Rotation.
 */
export function saveFilterPreset(name: string, filters: SavedFilterValues): SavedFilterPreset[] {
  const trimmedName = name.trim();
  if (!trimmedName) return getSavedFilters();

  const current = getSavedFilters().filter((p) => p.name.toLowerCase() !== trimmedName.toLowerCase());

  const newPreset: SavedFilterPreset = {
    id: `filter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmedName,
    createdAt: new Date().toISOString(),
    filters,
  };

  const updated = [newPreset, ...current].slice(0, MAX_PRESETS);
  persist(updated);
  return updated;
}

export function deleteFilterPreset(id: string): SavedFilterPreset[] {
  const updated = getSavedFilters().filter((p) => p.id !== id);
  persist(updated);
  return updated;
}
