// -----------------------------------------------------------------------------
// Zod-Validierungsschemata für alle API-Request-Bodies
// -----------------------------------------------------------------------------
import { z } from "zod";
import {
  APPLICATION_STATUS_VALUES,
  COMPANY_STATUS_VALUES,
  COVER_LETTER_STATUS_VALUES,
  COVER_LETTER_TONE_VALUES,
  DOCUMENT_CATEGORY_VALUES,
  EDUCATION_TYPE_VALUES,
  INTERACTION_TYPE_VALUES,
  JOB_PORTAL_VALUES,
  REMOTE_PREFERENCE_VALUES,
} from "./constants";

export const companySchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  street: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional(),
  website: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
  contactPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  status: z.enum(COMPANY_STATUS_VALUES).optional(),
  letterTemplate: z.string().optional().nullable(),
  preferredTone: z.enum(COVER_LETTER_TONE_VALUES).optional().nullable(),
  // Umgeht die Duplikat-Warnung in POST /api/companies (siehe
  // src/lib/companyDuplicates.ts) — wird vor dem eigentlichen
  // prisma.company.create() aus den Daten entfernt, ist also kein
  // tatsächliches Datenbankfeld.
  forceCreate: z.boolean().optional(),
});
export const companyUpdateSchema = companySchema.partial();

export const jobPostingSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  portalSource: z.enum(JOB_PORTAL_VALUES),
  sourceUrl: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  remote: z.boolean().optional(),
  requirementsProfile: z.string().optional().nullable(),
  techStack: z.string().optional().nullable(),
  salaryInfo: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  companyName: z.string().optional(), // Für "Bewerben"-Flow: legt Company an, falls nötig
  isDismissed: z.boolean().optional(),
  dismissReason: z.string().optional().nullable(),
  dismissedAt: z.string().datetime().optional().nullable().or(z.literal("")),
});
export const jobPostingUpdateSchema = jobPostingSchema.omit({ companyName: true }).partial();

export const jobDismissSchema = z.object({
  reason: z.string().optional().nullable(),
  blacklistCompany: z.boolean().optional(),
  excludeKeywords: z.array(z.string()).optional(),
  excludeTech: z.array(z.string()).optional(),
});

export const applicationSchema = z.object({
  position: z.string().min(1),
  status: z.enum(APPLICATION_STATUS_VALUES).optional(),
  applicationDate: z.string().datetime().optional().nullable().or(z.literal("")),
  nextStep: z.string().optional().nullable(),
  nextStepDate: z.string().datetime().optional().nullable().or(z.literal("")),
  meetingUrl: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  interviewStage: z.string().optional().nullable(),
  timeSpentMinutes: z.number().int().nonnegative().optional().nullable(),
  tags: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  companyId: z.string().min(1),
  jobPostingId: z.string().optional().nullable(),
});
export const applicationUpdateSchema = applicationSchema.partial().extend({
  companyId: z.string().min(1).optional(),
});

export const statusEventSchema = z.object({
  status: z.enum(APPLICATION_STATUS_VALUES),
  note: z.string().optional().nullable(),
});

export const interactionSchema = z.object({
  type: z.enum(INTERACTION_TYPE_VALUES),
  title: z.string().min(1, "Titel ist erforderlich"),
  summary: z.string().optional().nullable(),
  interactionDate: z.string().datetime().optional().nullable().or(z.literal("")),
});

export const documentSchema = z.object({
  name: z.string().min(1),
  category: z.enum(DOCUMENT_CATEGORY_VALUES),
  description: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  isDefault: z.boolean().optional(),
});
export const documentUpdateSchema = documentSchema.partial();

export const preferencesSchema = z.object({
  fullName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  desiredRole: z.string().optional(),
  techStack: z.string().optional(),
  preferredLocations: z.string().optional(),
  searchRadiusKm: z.number().int().optional(),
  remotePreference: z.enum(REMOTE_PREFERENCE_VALUES).optional(),
  minSalary: z.number().int().optional().nullable(),
  profileSummary: z.string().optional().nullable(),
  weeklyGoal: z.number().int().min(1).max(50).optional(),
  minMatchScore: z.number().int().min(0).max(100).optional(),
  excludedCompanies: z.string().optional().nullable(),
  excludedKeywords: z.string().optional().nullable(),
  excludedTechStack: z.string().optional().nullable(),
  aiProvider: z.string().optional().nullable(),
  aiApiKey: z.string().optional().nullable(),
  aiModel: z.string().optional().nullable(),
  portfolioActive: z.boolean().optional(),
  imapHost: z.string().optional().nullable(),
  imapPort: z.number().int().optional().nullable(),
  imapUser: z.string().optional().nullable(),
  imapPassword: z.string().optional().nullable(),
  imapFolder: z.string().optional().nullable(),
  imapEnabled: z.boolean().optional(),
  backgroundSchedulerEnabled: z.boolean().optional(),
});

export const jobLiveSearchSchema = z.object({
  query: z.string().default("Fachinformatiker Anwendungsentwicklung"),
  location: z.string().default("Bonn"),
  radius: z.number().int().default(50),
  source: z.enum(["ALL", "ARBEITSAGENTUR", "ARBEITNOW"]).default("ALL"),
  limit: z.number().int().min(1).max(50).default(20),
});

export const jobScrapeUrlSchema = z.object({
  url: z.string().url("Gültige URL erforderlich"),
});

export const emailSyncRunSchema = z.object({
  host: z.string().optional().nullable(),
  port: z.number().int().optional().nullable(),
  user: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  folder: z.string().optional().nullable(),
  simulate: z.boolean().optional().default(false),
});

export const educationEntrySchema = z.object({
  type: z.enum(EDUCATION_TYPE_VALUES),
  title: z.string().min(1),
  institution: z.string().optional().nullable(),
  startDate: z.string().datetime().optional().nullable().or(z.literal("")),
  endDate: z.string().datetime().optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});
export const educationEntryUpdateSchema = educationEntrySchema.partial();

export const projectEntrySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  techStack: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});
export const projectEntryUpdateSchema = projectEntrySchema.partial();

export const coverLetterGenerateSchema = z.object({
  applicationId: z.string().min(1),
  tone: z.enum(COVER_LETTER_TONE_VALUES).optional(),
  highlightProjectTitle: z.string().optional().nullable(),
});

export const coverLetterUpdateSchema = z.object({
  content: z.string().optional(),
  status: z.enum(COVER_LETTER_STATUS_VALUES).optional(),
});

export const batchActionSchema = z.object({
  action: z.enum(["SET_STATUS", "DELETE", "ADD_TAG", "REMOVE_TAG", "APPLY_STANDARD_PACKAGE"]),
  applicationIds: z.array(z.string()).min(1, "Mindestens eine Bewerbung auswählen"),
  status: z.enum(APPLICATION_STATUS_VALUES).optional(),
  rejectionReason: z.string().optional().nullable(),
  tag: z.string().optional(),
});

// -----------------------------------------------------------------------------
// Backup / Restore — validiert importierte JSON-Dateien (`POST /api/backup`),
// bevor sie in die Datenbank geschrieben werden. Ohne diese Prüfung würde
// eine manipulierte oder aus einer inkompatiblen Version stammende Datei nur
// über verstreute `as`-Type-Casts in `src/lib/backup.ts` verarbeitet, was zu
// stillen Dateninkonsistenzen oder kryptischen Prisma-Fehlern führen kann.
// -----------------------------------------------------------------------------
const isoDateOrString = z.union([z.string(), z.date()]).nullable().optional();

export const backupPreferencesSchema = z
  .object({
    fullName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    street: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    desiredRole: z.string().optional(),
    techStack: z.string().optional(),
    preferredLocations: z.string().optional(),
    searchRadiusKm: z.number().optional(),
    remotePreference: z.string().optional(),
    minSalary: z.number().nullable().optional(),
    profileSummary: z.string().nullable().optional(),
    weeklyGoal: z.number().optional(),
    excludedCompanies: z.string().nullable().optional(),
    excludedKeywords: z.string().nullable().optional(),
    excludedTechStack: z.string().nullable().optional(),
    aiProvider: z.string().nullable().optional(),
    aiModel: z.string().nullable().optional(),
    backgroundSchedulerEnabled: z.boolean().optional(),
    // aiApiKey und imapPassword werden von createFullBackup() absichtlich
    // nicht exportiert (siehe src/lib/backup.ts) und daher hier auch nicht
    // übernommen — selbst wenn eine ältere Backup-Datei eines der Felder noch
    // enthält, wird es beim Restore stillschweigend ignoriert (kein
    // Schema-Feld dafür).
  })
  .partial();

const backupEducationEntrySchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  institution: z.string().nullable().optional(),
  startDate: isoDateOrString,
  endDate: isoDateOrString,
  description: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
});

const backupProjectEntrySchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  techStack: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
});

const backupDocumentSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  category: z.string().optional(),
  description: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
});

const backupCompanySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  street: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

const backupJobPostingSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  portalSource: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  remote: z.boolean().nullable().optional(),
  requirementsProfile: z.string().nullable().optional(),
  techStack: z.string().nullable().optional(),
  salaryInfo: z.string().nullable().optional(),
  matchScore: z.number().nullable().optional(),
  companyId: z.string().nullable().optional(),
  isDismissed: z.boolean().nullable().optional(),
  dismissReason: z.string().nullable().optional(),
  dismissedAt: isoDateOrString,
});

const backupStatusEventSchema = z.object({
  status: z.string().optional(),
  note: z.string().nullable().optional(),
  changedAt: isoDateOrString,
});

const backupCoverLetterSchema = z.object({
  content: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

const backupApplicationSchema = z.object({
  id: z.string(),
  position: z.string().optional(),
  status: z.string().nullable().optional(),
  applicationDate: isoDateOrString,
  nextStep: z.string().nullable().optional(),
  nextStepDate: isoDateOrString,
  meetingUrl: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  companyId: z.string(),
  jobPostingId: z.string().nullable().optional(),
  statusEvents: z.array(backupStatusEventSchema).optional(),
  coverLetter: backupCoverLetterSchema.nullable().optional(),
});

export const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().optional(),
  preferences: backupPreferencesSchema.nullable().optional(),
  educationEntries: z.array(backupEducationEntrySchema).optional(),
  projectEntries: z.array(backupProjectEntrySchema).optional(),
  companies: z.array(backupCompanySchema).optional(),
  jobPostings: z.array(backupJobPostingSchema).optional(),
  applications: z.array(backupApplicationSchema).optional(),
  documents: z.array(backupDocumentSchema).optional(),
});

// -----------------------------------------------------------------------------
// Web-Push (src/lib/pushNotifications.ts) — Registrieren/Abmelden einer
// Browser-Subscription. Form entspricht `PushSubscription.toJSON()` aus der
// Push-API des Browsers.
// -----------------------------------------------------------------------------
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const aiRequestSchema = z.object({
  action: z.enum(["POLISH_COVER_LETTER", "EVALUATE_INTERVIEW_ANSWER"]),
  coverLetter: z.string().optional(),
  jobTitle: z.string().optional(),
  jobDescription: z.string().optional(),
  techStack: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  idealAnswer: z.string().optional(),
});
