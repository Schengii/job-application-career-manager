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

// -----------------------------------------------------------------------------
// Erlaubte Datei-Typen für den Dokumenten-Upload (`/api/documents/upload`)
// -----------------------------------------------------------------------------
// Bewusst als Allowlist statt Denylist: Hochgeladene Dateien landen unter
// `/public/uploads/` und sind damit öffentlich per URL abrufbar. Ohne
// Einschränkung könnte eine hochgeladene `.html`/`.svg`-Datei mit
// eingebettetem `<script>` beim Öffnen im Browser als gespeicherte
// Cross-Site-Scripting-Lücke ausgeführt werden. Erlaubt sind daher nur
// Dateitypen, die für Bewerbungsunterlagen (Lebenslauf, Zeugnisse, Fotos)
// tatsächlich benötigt werden und die Browser nicht als aktiven Code
// interpretieren. MIME-Type UND Dateiendung werden geprüft (siehe
// `route.ts`), da der vom Client gesendete MIME-Type nicht vertrauenswürdig
// ist.
export const ALLOWED_DOCUMENT_UPLOADS = [
  { mimeType: "application/pdf", extensions: [".pdf"] },
  { mimeType: "application/msword", extensions: [".doc"] },
  {
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: [".docx"],
  },
  { mimeType: "application/vnd.oasis.opendocument.text", extensions: [".odt"] },
  { mimeType: "image/jpeg", extensions: [".jpg", ".jpeg"] },
  { mimeType: "image/png", extensions: [".png"] },
  { mimeType: "image/webp", extensions: [".webp"] },
  { mimeType: "text/plain", extensions: [".txt"] },
] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = ALLOWED_DOCUMENT_UPLOADS.map((t) => t.mimeType);
export const ALLOWED_DOCUMENT_EXTENSIONS = ALLOWED_DOCUMENT_UPLOADS.flatMap((t) => t.extensions);

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

export const INTERACTION_TYPES = [
  { value: "CALL", label: "Telefonat", icon: "Phone" },
  { value: "EMAIL", label: "E-Mail Austausch", icon: "Mail" },
  { value: "INTERVIEW_ROUND", label: "Gesprächsrunde", icon: "Users" },
  { value: "FEEDBACK", label: "Feedback / Rückmeldung", icon: "MessageSquare" },
  { value: "NOTE", label: "Notiz / Zwischenstand", icon: "FileText" },
] as const;

export type InteractionType = (typeof INTERACTION_TYPES)[number]["value"];
export const INTERACTION_TYPE_VALUES = INTERACTION_TYPES.map((i) => i.value) as [
  InteractionType,
  ...InteractionType[],
];

export const REJECTION_REASONS = [
  "Zu wenig Berufserfahrung",
  "Gehaltsvorstellung nicht vereinbar",
  "Stelle intern besetzt / zurückgezogen",
  "Anderer Bewerber mit mehr spezifischem Tech-Stack",
  "Standort / Remote-Regelung passte nicht",
  "Keine Begründung erhalten (Standard-Absage)",
  "Nach Erstgespräch / Culture-Fit",
  "Sonstiges",
] as const;

export const COVER_LETTER_TONES = [
  { value: "MODERN", label: "Modern (Lösungsorientiert)" },
  { value: "CLASSIC", label: "Klassisch (Formell/Konzern)" },
  { value: "STARTUP", label: "Startup / Agil (Dynamisch)" },
  { value: "DETAILED", label: "Detailliert (Umschulung & Tech-Fokus)" },
] as const;

export type CoverLetterTone = (typeof COVER_LETTER_TONES)[number]["value"];
export const COVER_LETTER_TONE_VALUES = COVER_LETTER_TONES.map((t) => t.value) as [
  CoverLetterTone,
  ...CoverLetterTone[],
];

export const AI_PROVIDERS = [
  { value: "openai", label: "OpenAI (GPT-4o / GPT-4o-mini)" },
  { value: "anthropic", label: "Anthropic Claude (Claude 3.5 Sonnet)" },
  { value: "openrouter", label: "OpenRouter (Universal Router)" },
  { value: "ollama", label: "Ollama (Lokales Modell auf localhost:11434)" },
] as const;

export const JOB_DISMISS_REASONS = [
  { value: "TECH_MISMATCH", label: "Tech-Stack unpassend" },
  { value: "UNWANTED_COMPANY", label: "Unternehmen unpassend (Blacklist)" },
  { value: "LOCATION_MISMATCH", label: "Standort / Kein Remote" },
  { value: "SENIORITY_MISMATCH", label: "Seniorität / Rolle unpassend" },
  { value: "SALARY_TOO_LOW", label: "Gehalt / Konditionen unpassend" },
  { value: "OTHER", label: "Sonstiges" },
] as const;

export type JobDismissReason = (typeof JOB_DISMISS_REASONS)[number]["value"];
export const JOB_DISMISS_REASON_VALUES = JOB_DISMISS_REASONS.map((r) => r.value) as [
  JobDismissReason,
  ...JobDismissReason[],
];

export const INTERVIEW_STAGES = [
  { value: "SCREENING", label: "Telefon-Screening / HR", color: "blue" },
  { value: "CODING_CHALLENGE", label: "Coding Challenge / Aufgabe", color: "amber" },
  { value: "TECH_INTERVIEW", label: "Technisches Fachgespräch", color: "purple" },
  { value: "FINAL_ROUND", label: "Finales Gespräch / Management", color: "indigo" },
  { value: "OFFER_STAGE", label: "Vertragsverhandlung / Angebot", color: "green" },
] as const;

export type InterviewStage = (typeof INTERVIEW_STAGES)[number]["value"];
export const INTERVIEW_STAGE_VALUES = INTERVIEW_STAGES.map((s) => s.value) as [
  InterviewStage,
  ...InterviewStage[],
];

/** Hilfsfunktion, um zu einem Status-Value das passende Label/Color-Objekt zu holen. */
export function findStatusMeta<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string,
): T | undefined {
  return list.find((item) => item.value === value);
}

