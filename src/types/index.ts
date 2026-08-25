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
  DocumentModel,
  EducationEntryModel,
  JobPostingModel,
  PreferencesModel,
  ProjectEntryModel,
} from "@/generated/prisma/models";

export type Application = ApplicationModel;
export type ApplicationStatusEvent = ApplicationStatusEventModel;
export type ApplicationInteraction = ApplicationInteractionModel;
export type Company = CompanyModel;
export type CoverLetter = CoverLetterModel;
export type Document = DocumentModel;
export type EducationEntry = EducationEntryModel;
export type JobPosting = JobPostingModel;
export type Preferences = PreferencesModel;
export type ProjectEntry = ProjectEntryModel;

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
