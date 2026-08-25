// -----------------------------------------------------------------------------
// Zod-Validierungsschemata für alle API-Request-Bodies
// -----------------------------------------------------------------------------
import { z } from "zod";
import {
  APPLICATION_STATUS_VALUES,
  COMPANY_STATUS_VALUES,
  COVER_LETTER_STATUS_VALUES,
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
});
export const jobPostingUpdateSchema = jobPostingSchema.omit({ companyName: true }).partial();

export const applicationSchema = z.object({
  position: z.string().min(1),
  status: z.enum(APPLICATION_STATUS_VALUES).optional(),
  applicationDate: z.string().datetime().optional().nullable().or(z.literal("")),
  nextStep: z.string().optional().nullable(),
  nextStepDate: z.string().datetime().optional().nullable().or(z.literal("")),
  meetingUrl: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
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
  aiProvider: z.string().optional().nullable(),
  aiApiKey: z.string().optional().nullable(),
  aiModel: z.string().optional().nullable(),
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
  tone: z.enum(["MODERN", "CLASSIC", "STARTUP", "DETAILED"]).optional(),
  highlightProjectTitle: z.string().optional().nullable(),
});

export const coverLetterUpdateSchema = z.object({
  content: z.string().optional(),
  status: z.enum(COVER_LETTER_STATUS_VALUES).optional(),
});

export const batchActionSchema = z.object({
  action: z.enum(["SET_STATUS", "DELETE", "ADD_TAG", "REMOVE_TAG"]),
  applicationIds: z.array(z.string()).min(1, "Mindestens eine Bewerbung auswählen"),
  status: z.enum(APPLICATION_STATUS_VALUES).optional(),
  rejectionReason: z.string().optional().nullable(),
  tag: z.string().optional(),
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
