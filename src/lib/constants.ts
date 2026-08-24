// -----------------------------------------------------------------------------
// Zentrale Konstanten & Status-Definitionen
// -----------------------------------------------------------------------------
// Da SQLite in Prisma keine nativen Enums unterstützt, werden alle "enum"-
// artigen Felder als String in der DB gespeichert. Hier definieren wir die
// erlaubten Werte, deutsche Anzeige-Labels und Farben für Badges an EINER
// zentralen Stelle — sowohl Backend (Validierung) als auch Frontend (Anzeige)
// greifen darauf zu.
// -----------------------------------------------------------------------------

export const APPLICATION_STATUSES = [
  { value: "DRAFT", label: "Entwurf", color: "slate" },
  { value: "SENT", label: "Gesendet (Offen)", color: "yellow" },
  { value: "INTERVIEW", label: "Vorstellungsgespräch", color: "blue" },
  { value: "OFFER", label: "Zusage", color: "green" },
  { value: "REJECTED", label: "Absage", color: "red" },
  { value: "WITHDRAWN", label: "Zurückgezogen", color: "gray" },
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]["value"];
export const APPLICATION_STATUS_VALUES = APPLICATION_STATUSES.map((s) => s.value) as [
  ApplicationStatus,
  ...ApplicationStatus[],
];

export const COMPANY_STATUSES = [
  { value: "LEAD", label: "Lead", color: "slate" },
  { value: "CONTACTED", label: "Kontaktiert", color: "blue" },
  { value: "IN_PROGRESS", label: "In Bearbeitung", color: "amber" },
  { value: "PARTNER", label: "Partner", color: "green" },
  { value: "REJECTED", label: "Abgelehnt", color: "red" },
  { value: "ARCHIVED", label: "Archiviert", color: "gray" },
] as const;

export type CompanyStatus = (typeof COMPANY_STATUSES)[number]["value"];
export const COMPANY_STATUS_VALUES = COMPANY_STATUSES.map((s) => s.value) as [
  CompanyStatus,
  ...CompanyStatus[],
];

export const JOB_PORTALS = [
  { value: "STEPSTONE", label: "Stepstone" },
  { value: "INDEED", label: "Indeed" },
  { value: "GETINIT", label: "GetInIT" },
  { value: "ARBEITSAGENTUR", label: "Agentur für Arbeit" },
  { value: "JOBWARE", label: "Jobware" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "JOBOO", label: "Joboo" },
  { value: "STELLENANZEIGEN_DE", label: "Stellenanzeigen.de" },
  { value: "OTHER", label: "Sonstige" },
] as const;

export type JobPortal = (typeof JOB_PORTALS)[number]["value"];
export const JOB_PORTAL_VALUES = JOB_PORTALS.map((p) => p.value) as [JobPortal, ...JobPortal[]];

export const DOCUMENT_CATEGORIES = [
  { value: "LEBENSLAUF", label: "Lebenslauf" },
  { value: "ZEUGNIS_SCHULE", label: "Schulzeugnis (Mittlere Reife)" },
  { value: "ZEUGNIS_AUSBILDUNG", label: "Ausbildungszeugnis (Elektroniker für Betriebstechnik)" },
  { value: "ZEUGNIS_UMSCHULUNG", label: "Umschulungszeugnis" },
  { value: "REFERENZ", label: "Referenz / Projekt" },
  { value: "ANSCHREIBEN", label: "Anschreiben" },
  { value: "SONSTIGES", label: "Sonstiges" },
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]["value"];
export const DOCUMENT_CATEGORY_VALUES = DOCUMENT_CATEGORIES.map((c) => c.value) as [
  DocumentCategory,
  ...DocumentCategory[],
];

export const REMOTE_PREFERENCES = [
  { value: "ONSITE", label: "Vor Ort" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "REMOTE", label: "Vollständig Remote" },
  { value: "ANY", label: "Egal" },
] as const;

export type RemotePreference = (typeof REMOTE_PREFERENCES)[number]["value"];
export const REMOTE_PREFERENCE_VALUES = REMOTE_PREFERENCES.map((r) => r.value) as [
  RemotePreference,
  ...RemotePreference[],
];

export const EDUCATION_TYPES = [
  { value: "SCHULE", label: "Schulabschluss" },
  { value: "AUSBILDUNG", label: "Ausbildung" },
  { value: "UMSCHULUNG", label: "Umschulung" },
  { value: "WEITERBILDUNG", label: "Weiterbildung" },
] as const;

export type EducationType = (typeof EDUCATION_TYPES)[number]["value"];
export const EDUCATION_TYPE_VALUES = EDUCATION_TYPES.map((e) => e.value) as [
  EducationType,
  ...EducationType[],
];

export const COVER_LETTER_STATUSES = [
  { value: "DRAFT", label: "Entwurf", color: "slate" },
  { value: "SENT", label: "Gesendet", color: "blue" },
] as const;

export type CoverLetterStatus = (typeof COVER_LETTER_STATUSES)[number]["value"];
export const COVER_LETTER_STATUS_VALUES = COVER_LETTER_STATUSES.map((c) => c.value) as [
  CoverLetterStatus,
  ...CoverLetterStatus[],
];

/** Hilfsfunktion, um zu einem Status-Value das passende Label/Color-Objekt zu holen. */
export function findStatusMeta<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string,
): T | undefined {
  return list.find((item) => item.value === value);
}
