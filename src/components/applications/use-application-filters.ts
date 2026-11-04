"use client";

// -----------------------------------------------------------------------------
// Filter-State der Bewerbungsliste: Filterwerte, entprellte Volltextsuche,
// Seitenzähler der (serverseitig paginierten) Tabellenansicht und der daraus
// abgeleitete SWR-Key. Ausgelagert aus src/app/applications/page.tsx.
// -----------------------------------------------------------------------------
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_APPLICATION_FILTERS,
  type ApplicationFilters,
} from "@/lib/applications/applicationFilters";
import type { SavedFilterValues } from "@/lib/applications/savedFilters";
import type { ApplicationSortOption } from "@/lib/applications/applicationQuery";

export const TABLE_PAGE_SIZE = 25;
// Verzögerung, bevor eine geänderte Volltextsuche einen neuen (paginierten)
// Server-Request auslöst — verhindert einen Request pro Tastenanschlag.
const SEARCH_DEBOUNCE_MS = 300;

export function useApplicationFilters() {
  const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_APPLICATION_FILTERS);
  const [tablePageNum, setTablePageNum] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Bei jeder Filteränderung zurück auf Seite 1 (sonst könnte man auf einer
  // Seite landen, die es für den neuen Filter gar nicht mehr gibt). Bewusst
  // NICHT als useEffect (das würde einen zusätzlichen Render-Durchlauf nach
  // dem Commit erzwingen), sondern als "State während des Renderns anpassen"
  // — das von React empfohlene Muster für abgeleiteten State (siehe
  // react-hooks/set-state-in-effect).
  const filterSignature = `${filters.status}|${filters.portal}|${filters.tag}|${debouncedSearch}|${filters.onlyFollowUps}|${filters.sortBy}`;
  const [prevFilterSignature, setPrevFilterSignature] = useState(filterSignature);
  if (filterSignature !== prevFilterSignature) {
    setPrevFilterSignature(filterSignature);
    setTablePageNum(1);
  }

  const tableQueryKey = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(tablePageNum));
    params.set("pageSize", String(TABLE_PAGE_SIZE));
    if (filters.status !== "ALL") params.set("status", filters.status);
    if (filters.portal !== "ALL") params.set("portal", filters.portal);
    if (filters.tag !== "ALL") params.set("tag", filters.tag);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (filters.onlyFollowUps) params.set("onlyFollowUps", "true");
    params.set("sortBy", filters.sortBy);
    return `/api/applications?${params.toString()}`;
  }, [tablePageNum, filters.status, filters.portal, filters.tag, debouncedSearch, filters.onlyFollowUps, filters.sortBy]);

  function setFilter<K extends keyof ApplicationFilters>(key: K, value: ApplicationFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  /** Setzt alle Filter zurück; die gewählte Sortierung bleibt bewusst erhalten. */
  function resetFilters() {
    setFilters((prev) => ({ ...DEFAULT_APPLICATION_FILTERS, sortBy: prev.sortBy }));
  }

  function applyPreset(preset: SavedFilterValues) {
    setFilters({
      status: preset.status,
      portal: preset.portal,
      tag: preset.tag ?? "ALL",
      search: preset.search,
      onlyFollowUps: preset.onlyFollowUps,
      sortBy: preset.sortBy as ApplicationSortOption,
    });
  }

  return {
    filters,
    setFilter,
    resetFilters,
    applyPreset,
    tablePageNum,
    setTablePageNum,
    tableQueryKey,
  };
}
