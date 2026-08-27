// -----------------------------------------------------------------------------
// Unternehmens-Duplikat-Erkennung: verhindert versehentliche Dubletten beim
// manuellen Anlegen (z.B. "Acme GmbH" vs. "ACME" vs. "acme gmbh."), ohne
// echte Namensgleichheit über ein DB-Unique-Constraint hart zu erzwingen —
// unterschiedliche Unternehmen können legitim ähnliche Namen tragen (z.B.
// Filialen), daher nur eine Warnung mit expliziter "trotzdem anlegen"-Option
// (siehe POST /api/companies und company-form-dialog.tsx).
// -----------------------------------------------------------------------------

// Gängige deutsche/internationale Rechtsform-Suffixe, die beim Vergleich
// ignoriert werden — sonst würden "Acme GmbH" und "Acme AG" fälschlich nicht
// als potenzielle Dubletten erkannt, obwohl im Alltag oft nur die Rechtsform
// variiert wird oder schlicht vergessen/falsch abgeschrieben wurde.
const LEGAL_SUFFIXES = /\b(gmbh|ag|kg|ohg|co|se|ug|ev|e\s*v|ltd|inc|gbr)\b\.?/g;
// Unicode-Range der kombinierenden diakritischen Zeichen (U+0300–U+036F), die
// nach `String.prototype.normalize("NFKD")` übrig bleiben, z.B. zerlegt
// "ä" -> "a" + U+0308 (Combining Diaeresis). Als \u-Escape statt Literal-
// Zeichen geschrieben, damit die Range im Quellcode eindeutig lesbar bleibt.
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** Normalisiert einen Unternehmensnamen für den Duplikat-Vergleich: Kleinschreibung,
 *  Diakritika/Umlaute vereinheitlicht, Rechtsform-Suffixe & Satzzeichen entfernt. */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(LEGAL_SUFFIXES, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type CompanyDuplicateCandidate = { id: string; name: string };

/** Findet bestehende Unternehmen, deren normalisierter Name exakt dem
 *  normalisierten neuen Namen entspricht. Leerer/nur-aus-Rechtsform-bestehender
 *  Name führt zu keinem Treffer (verhindert falsch-positive Massentreffer). */
export function findCompanyDuplicates(
  name: string,
  existing: CompanyDuplicateCandidate[]
): CompanyDuplicateCandidate[] {
  const normalized = normalizeCompanyName(name);
  if (!normalized) return [];
  return existing.filter((c) => normalizeCompanyName(c.name) === normalized);
}
