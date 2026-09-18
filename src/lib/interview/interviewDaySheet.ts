// -----------------------------------------------------------------------------
// Mobile Interview Day Quick-Sheet Datenhelfer
// -----------------------------------------------------------------------------

export interface InterviewDayData {
  applicationId: string;
  companyName: string;
  position: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  fullAddress?: string | null;
  mapsNavigationUrl?: string | null;
  meetingUrl?: string | null;
  interviewStage?: string | null;
  nextStepDate?: Date | string | null;
  targetSalary?: number | null;
  notes?: string | null;
  topTechSkills: string[];
  keyQuestionsToAsk: string[];
}

export function generateMapsNavigationUrl(street?: string | null, postalCode?: string | null, city?: string | null): string | null {
  const parts = [street, postalCode, city].filter(Boolean);
  if (parts.length === 0) return null;
  const query = encodeURIComponent(parts.join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export const DEFAULT_INTERVIEW_DAY_QUESTIONS = [
  "Wie sieht ein typischer Sprint / Release-Zyklus im Frontend-Team aus?",
  "Welche Rolle spielen Code-Reviews, Automated Testing und CI/CD bei Ihnen?",
  "Was ist die größte technische Herausforderung, vor der das Team in den nächsten 6 Monaten steht?",
  "Wie wird Weiterbildung und der Umstieg auf modernere Technologien (z.B. React 19 / TS 5) gefördert?",
];

export function buildInterviewDayData(app: {
  id: string;
  position: string;
  interviewStage?: string | null;
  nextStepDate?: Date | string | null;
  meetingUrl?: string | null;
  notes?: string | null;
  company: {
    name: string;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
  };
  jobPosting?: {
    techStack?: string | null;
  } | null;
}): InterviewDayData {
  const fullAddress = [app.company.street, [app.company.postalCode, app.company.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  const mapsUrl = generateMapsNavigationUrl(app.company.street, app.company.postalCode, app.company.city);

  const rawTech = app.jobPosting?.techStack || "TypeScript, React, CSS, Next.js";
  const topTechSkills = rawTech
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  return {
    applicationId: app.id,
    companyName: app.company.name,
    position: app.position,
    contactName: app.company.contactName,
    contactPhone: app.company.contactPhone,
    contactEmail: app.company.contactEmail,
    fullAddress: fullAddress || null,
    mapsNavigationUrl: mapsUrl,
    meetingUrl: app.meetingUrl,
    interviewStage: app.interviewStage || "Vorstellungsgespräch",
    nextStepDate: app.nextStepDate,
    notes: app.notes,
    topTechSkills,
    keyQuestionsToAsk: DEFAULT_INTERVIEW_DAY_QUESTIONS,
  };
}
