import { Preferences, PreferencesWithProfile } from "@/types";

export interface JsonResumeSchema {
  $schema?: string;
  basics: {
    name?: string;
    label?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
      address?: string;
      postalCode?: string;
      city?: string;
      countryCode?: string;
      region?: string;
    };
  };
  work?: Array<{
    name?: string;
    position?: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education?: Array<{
    institution?: string;
    area?: string;
    studyType?: string;
    startDate?: string;
    endDate?: string;
    score?: string;
    courses?: string[];
  }>;
  skills?: Array<{
    name?: string;
    level?: string;
    keywords?: string[];
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
    roles?: string[];
    entity?: string;
    type?: string;
  }>;
}

/**
 * Exportiert Preferences in das standardisierte JSON-Resume Format
 */
export function exportToJsonResume(preferences: PreferencesWithProfile): JsonResumeSchema {
  const skillsArray = (preferences.techStack || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: preferences.fullName || "Bewerber",
      label: preferences.desiredRole || "Fachinformatiker für Anwendungsentwicklung",
      email: preferences.email || undefined,
      phone: preferences.phone || undefined,
      summary: preferences.profileSummary || undefined,
      location: {
        address: preferences.street || undefined,
        postalCode: preferences.postalCode || undefined,
        city: preferences.city || "Bonn",
        countryCode: "DE",
        region: "Nordrhein-Westfalen",
      },
    },
    skills: [
      {
        name: "Software & Web Development",
        level: "Junior / Mid",
        keywords: skillsArray,
      },
    ],
    education: preferences.educationEntries.map((edu) => ({
      institution: edu.institution || "Ausbildungsstätte",
      area: edu.title,
      studyType: edu.type,
      startDate: edu.startDate ? new Date(edu.startDate).toISOString().slice(0, 7) : undefined,
      endDate: edu.endDate ? new Date(edu.endDate).toISOString().slice(0, 7) : undefined,
      courses: edu.description ? [edu.description] : undefined,
    })),
    projects: preferences.projectEntries.map((proj) => ({
      name: proj.title,
      description: proj.description || undefined,
      url: proj.url || undefined,
      roles: proj.role ? [proj.role] : ["Entwickler"],
      keywords: proj.techStack ? proj.techStack.split(",").map((s) => s.trim()) : [],
    })),
  };
}

/**
 * Validiert und importiert ein JSON-Resume Schema in ein Preferences-Update-Objekt
 */
export function parseJsonResumeImport(json: JsonResumeSchema): {
  preferences: Partial<Preferences>;
  education: Array<{ type: string; title: string; institution?: string; description?: string; startDate?: Date; endDate?: Date }>;
  projects: Array<{ title: string; description?: string; techStack?: string; url?: string; role?: string }>;
} {
  const basics = json.basics || {};
  const location = basics.location || {};

  const skills = json.skills?.flatMap((s) => s.keywords || []).filter(Boolean) || [];

  const education = (json.education || []).map((e) => {
    let type = "WEITERBILDUNG";
    const studyTypeLower = (e.studyType || "").toLowerCase();
    if (studyTypeLower.includes("ausbildung")) type = "AUSBILDUNG";
    else if (studyTypeLower.includes("umschulung")) type = "UMSCHULUNG";
    else if (studyTypeLower.includes("schule") || studyTypeLower.includes("abitur") || studyTypeLower.includes("reife")) type = "SCHULE";

    return {
      type,
      title: e.area || e.institution || "Bildungsabschluss",
      institution: e.institution,
      description: e.courses?.join(" • "),
      startDate: e.startDate ? new Date(e.startDate) : undefined,
      endDate: e.endDate ? new Date(e.endDate) : undefined,
    };
  });

  const projects = (json.projects || []).map((p) => ({
    title: p.name || "Projekt",
    description: p.description,
    techStack: p.keywords?.join(", "),
    url: p.url,
    role: p.roles?.[0] || "Entwickler",
  }));

  return {
    preferences: {
      fullName: basics.name,
      email: basics.email,
      phone: basics.phone,
      street: location.address,
      postalCode: location.postalCode,
      city: location.city,
      desiredRole: basics.label,
      profileSummary: basics.summary,
      techStack: skills.length > 0 ? skills.join(",") : undefined,
    },
    education,
    projects,
  };
}
