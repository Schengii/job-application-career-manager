// -----------------------------------------------------------------------------
// Frontend-Typen: erweitern die generierten Prisma-Modelltypen um die
// Relationen, die von den jeweiligen API-Endpunkten mitgeliefert werden.
// -----------------------------------------------------------------------------
import type {
  ApplicationInteractionModel,
  ApplicationModel,
  ApplicationStatusEventModel,
  CompanyModel,
  CoverLetterModel,
  CoverLetterSnippetModel,
  DocumentModel,
  EducationEntryModel,
  JobPostingModel,
  PreferencesModel,
  ProjectEntryModel,
  PushSubscriptionModel,
  SentPushNotificationModel,
} from "@/generated/prisma/models";

export type Application = ApplicationModel;
export type ApplicationStatusEvent = ApplicationStatusEventModel;
export type ApplicationInteraction = ApplicationInteractionModel;
export type Company = CompanyModel;
export type CoverLetter = CoverLetterModel;
export type CoverLetterSnippet = CoverLetterSnippetModel;
export type Document = DocumentModel;
export type EducationEntry = EducationEntryModel;
export type JobPosting = JobPostingModel;
export type Preferences = PreferencesModel;
export type ProjectEntry = ProjectEntryModel;
export type PushSubscription = PushSubscriptionModel;
export type SentPushNotification = SentPushNotificationModel;

export type CompanyWithCounts = Company & {
  _count: { applications: number; jobPostings: number };
};

export type CompanyDetail = Company & {
  applications: (Application & { jobPosting: JobPosting | null })[];
  jobPostings: JobPosting[];
};

export type JobPostingWithCompany = JobPosting & {
  company: Company | null;
  _count?: { applications: number };
};

export type ApplicationListItem = Application & {
  company: Company;
  jobPosting: JobPosting | null;
  coverLetter: CoverLetter | null;
  // Die letzten Status-Änderungen (neueste zuerst) — genutzt u.a. von
  // src/lib/notifications.ts, um Absage-/Zusage-/Interview-Benachrichtigungen
  // aus tatsächlichen Statuswechseln abzuleiten.
  statusEvents: Pick<ApplicationStatusEvent, "id" | "status" | "changedAt">[];
  _count: { statusEvents: number; documents: number };
};

export type ApplicationDetail = Application & {
  company: Company;
  jobPosting: JobPosting | null;
  coverLetter: CoverLetter | null;
  statusEvents: ApplicationStatusEvent[];
  interactions: ApplicationInteraction[];
  documents: { document: Document; documentId: string; applicationId: string; attachedAt: Date }[];
};

export type PreferencesWithProfile = Preferences & {
  educationEntries: EducationEntry[];
  projectEntries: ProjectEntry[];
};

/**
 * Form, in der `/api/preferences` die Präferenzen an den Client zurückgibt:
 * `aiApiKey`/`imapPassword` sind immer `null` (die echten Werte verlassen den
 * Server nie), dafür gibt es `hasAiApiKey`/`aiApiKeyPreview` bzw.
 * `hasImapPassword`/`imapPasswordPreview`, um dem Nutzer zu zeigen, dass (und
 * mit welchem Suffix) bereits ein Wert hinterlegt ist (siehe
 * `toPublicPreferences()` in src/lib/preferences.ts).
 */
export type PreferencesPublic = Omit<PreferencesWithProfile, "aiApiKey" | "imapPassword"> & {
  aiApiKey: null;
  hasAiApiKey: boolean;
  aiApiKeyPreview: string | null;
  imapPassword: null;
  hasImapPassword: boolean;
  imapPasswordPreview: string | null;
};

export type Metrics = {
  total: number;
  open: number;
  draft: number;
  sent: number;
  interview: number;
  offer: number;
  rejected: number;
  withdrawn: number;
  companies: number;
  jobs: number;
};
