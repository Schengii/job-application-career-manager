// -----------------------------------------------------------------------------
// LinkedIn & XING Profil-Importer & Parser (JSON & CV-Text)
// -----------------------------------------------------------------------------
// Parst strukturierte Profil-Daten aus LinkedIn/XING-Exporten oder Profiltexten
// in interne Karrierestationen, Skills und Kurzprofil.
// -----------------------------------------------------------------------------

export interface ImportedProfileData {
  fullName?: string;
  headline?: string;
  summary?: string;
  extractedSkills: string[];
  experiences: {
    title: string;
    company: string;
    period: string;
    description?: string;
  }[];
  education: {
    school: string;
    degree: string;
    period: string;
  }[];
}

export function parseLinkedInJsonProfile(jsonString: string): ImportedProfileData {
  try {
    const data = JSON.parse(jsonString);

    const fullName = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.name || data.fullName;
    const headline = data.headline || data.title || "";
    const summary = data.summary || data.about || "";

    const skills: string[] = Array.isArray(data.skills)
      ? data.skills.map((s: unknown) => (typeof s === "string" ? s : (s as { name?: string }).name || "")).filter(Boolean)
      : [];

    const experiences = Array.isArray(data.positions || data.experience)
      ? (data.positions || data.experience).map((p: Record<string, unknown>) => ({
          title: String(p.title || "Entwickler"),
          company: String(p.companyName || p.company || ""),
          period: String(p.timePeriod || p.period || ""),
          description: p.description ? String(p.description) : undefined,
        }))
      : [];

    const education = Array.isArray(data.education || data.schools)
      ? (data.education || data.schools).map((e: Record<string, unknown>) => ({
          school: String(e.schoolName || e.school || ""),
          degree: String(e.degreeName || e.degree || ""),
          period: String(e.timePeriod || e.period || ""),
        }))
      : [];

    return {
      fullName,
      headline,
      summary,
      extractedSkills: skills,
      experiences,
      education,
    };
  } catch {
    return {
      extractedSkills: [],
      experiences: [],
      education: [],
    };
  }
}

export function parseLinkedInTextProfile(text: string): ImportedProfileData {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const skills = new Set<string>();

  const commonKeywords = [
    "React",
    "TypeScript",
    "JavaScript",
    "Next.js",
    "Tailwind CSS",
    "Node.js",
    "SQL",
    "PostgreSQL",
    "Git",
    "Docker",
    "REST",
    "GraphQL",
    "Scrum",
    "Agile",
  ];

  for (const kw of commonKeywords) {
    if (new RegExp(`\\b${kw}\\b`, "i").test(text)) {
      skills.add(kw);
    }
  }

  const fullName = lines.length > 0 ? lines[0] : undefined;
  const headline = lines.length > 1 ? lines[1] : undefined;

  return {
    fullName,
    headline,
    summary: text.slice(0, 300),
    extractedSkills: Array.from(skills),
    experiences: [],
    education: [],
  };
}
