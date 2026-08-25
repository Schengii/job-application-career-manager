// -----------------------------------------------------------------------------
// Tagging & Label Management Engine
// -----------------------------------------------------------------------------
// Hilfsfunktionen zur Normalisierung, Verwaltung und Farbkodierung
// von flexiblen Tags bei Unternehmen und Bewerbungen.
// -----------------------------------------------------------------------------

export type TagMeta = {
  name: string;
  colorClass: string;
};

const TAG_COLOR_PRESETS: Record<string, string> = {
  prio1: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  prio2: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  remote: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  "100remote": "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  startup: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  konzern: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  agentur: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  react: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  react19: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  typescript: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  empfehlung: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
  trainee: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
  junior: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

const DEFAULT_TAG_COLOR = "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30";

/**
 * Wandelt einen kommaseparierten Tag-String in ein Array von bereinigten Tags um.
 */
export function parseTags(tagsString?: string | null): string[] {
  if (!tagsString) return [];
  return tagsString
    .split(",")
    .map((t) => t.trim().replace(/^#+/, ""))
    .filter(Boolean);
}

/**
 * Kombiniert ein Tag-Array wieder zu einem sauberen kommaseparierten String.
 */
export function stringifyTags(tags: string[]): string {
  const unique = Array.from(
    new Set(tags.map((t) => t.trim().replace(/^#+/, "")).filter(Boolean))
  );
  return unique.join(",");
}

/**
 * Fügt einen Tag zu einem bestehenden Tag-String hinzu (ohne Duplikate).
 */
export function addTag(existingTags: string | null | undefined, newTag: string): string {
  const list = parseTags(existingTags);
  const clean = newTag.trim().replace(/^#+/, "");
  if (!clean) return stringifyTags(list);
  if (!list.some((t) => t.toLowerCase() === clean.toLowerCase())) {
    list.push(clean);
  }
  return stringifyTags(list);
}

/**
 * Entfernt einen Tag aus einem Tag-String.
 */
export function removeTag(existingTags: string | null | undefined, tagToRemove: string): string {
  const list = parseTags(existingTags);
  const clean = tagToRemove.trim().replace(/^#+/, "").toLowerCase();
  const filtered = list.filter((t) => t.toLowerCase() !== clean);
  return stringifyTags(filtered);
}

/**
 * Liefert das passende Farbstyling für einen Tag.
 */
export function getTagStyle(tag: string): string {
  const key = tag.toLowerCase().replace(/[^a-z0-9]/g, "");
  return TAG_COLOR_PRESETS[key] || DEFAULT_TAG_COLOR;
}

/**
 * Prüft, ob ein gegebener Tag-String alle Such-Tags enthält.
 */
export function matchesTags(tagsString: string | null | undefined, filterTag: string): boolean {
  if (!filterTag || filterTag === "ALL") return true;
  const current = parseTags(tagsString).map((t) => t.toLowerCase());
  return current.includes(filterTag.toLowerCase().replace(/^#+/, ""));
}
