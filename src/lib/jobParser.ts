// -----------------------------------------------------------------------------
// Job-Text-Parser: Schnellerfassung aus Freitext-Stellenanzeigen
// -----------------------------------------------------------------------------
// Extrahiert automatisch strukturierte Felder (Titel, Unternehmen, Ort,
// Remote-Anteil, Tech-Stack, Gehalt, Anforderungsprofil) aus unstrukturiertem
// Text von Jobbörsen oder E-Mails.
// -----------------------------------------------------------------------------

export type ParsedJob = {
  title: string;
  companyName: string;
  location: string | null;
  remote: boolean;
  techStack: string[];
  salaryInfo: string | null;
  requirementsProfile: string | null;
  description: string;
};

const COMMON_TECH_KEYWORDS = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "HTML",
  "HTML5",
  "CSS",
  "CSS3",
  "Tailwind",
  "TailwindCSS",
  "Sass",
  "SCSS",
  "Node.js",
  "NodeJS",
  "Express",
  "NestJS",
  "Python",
  "Django",
  "PHP",
  "Laravel",
  "Java",
  "Spring",
  "C#",
  ".NET",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "SQLite",
  "MongoDB",
  "Prisma",
  "Git",
  "GitHub",
  "GitLab",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "REST",
  "GraphQL",
  "CI/CD",
  "Jest",
  "Vitest",
  "Playwright",
  "Cypress",
  "Figma",
  "Agile",
  "Scrum",
];

const KNOWN_LOCATIONS = [
  "Bonn",
  "Köln",
  "Dortmund",
  "Düsseldorf",
  "Essen",
  "Bochum",
  "Duisburg",
  "Frankfurt",
  "München",
  "Berlin",
  "Hamburg",
  "Stuttgart",
  "Aachen",
  "Münster",
  "Wuppertal",
  "Bielefeld",
];

export function parseJobText(rawText: string): ParsedJob {
  const text = rawText.trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Titel erkennen
  let title = "Softwareentwickler / Frontend-Entwickler";
  const titlePatterns = [
    /(?:wir suchen|stelle als|position als|job:|stelle:|titel:)\s*([^\n\r.]+)/i,
    /((?:Junior |Senior |Lead |Fullstack |Frontend |Backend |Web-?|Software-?)?(?:Entwickler(?:in)?|Developer|Software Engineer|Fachinformatiker(?:in)? Anwendungsentwicklung|Frontend-Entwickler(?:in)?)[^\n\r,]*)/i,
  ];

  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim().length > 3 && match[1].trim().length < 80) {
      title = match[1].trim();
      break;
    }
  }

  // Falls in den ersten Zeilen ein kurzer Titel steht
  if (lines.length > 0 && lines[0].length < 60 && !lines[0].toLowerCase().includes("http") && !lines[0].includes("@")) {
    if (/entwickler|developer|engineer|fachinformatiker|frontend|web/i.test(lines[0])) {
      title = lines[0];
    }
  }

  // 2. Unternehmen erkennen
  let companyName = "Unternehmen";
  const companyPatterns = [
    /(?:bei|der|die|für)\s+([A-ZÄÖÜ][A-Za-z0-9\s&.-]+(?:\s+(?:GmbH|AG|SE|KG|GmbH & Co\. KG|UG|e\.V\.)))/i,
    /(?:Unternehmen|Firma|Arbeitgeber):\s*([^\n\r]+)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]?.trim().length > 2 && match[1].trim().length < 60) {
      companyName = match[1].trim();
      break;
    }
  }

  // 3. Standort & Remote
  let location: string | null = null;
  for (const loc of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${loc}\\b`, "i");
    if (regex.test(text)) {
      location = loc;
      break;
    }
  }

  const remote = /remote|home-?office|ortsunabhängig|100% remote|deutschlandweit/i.test(text);

  // 4. Tech-Stack scannen
  const foundTech = new Set<string>();
  const lowerText = text.toLowerCase();
  for (const tech of COMMON_TECH_KEYWORDS) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-zA-Z0-9#+])${escaped}([^a-zA-Z0-9#+]|$)`, "i");
    if (regex.test(text) || lowerText.includes(tech.toLowerCase())) {
      foundTech.add(tech);
    }
  }

  // 5. Gehalt erkennen
  let salaryInfo: string | null = null;
  const salaryMatch = text.match(/(\d{2,3}(?:\.\d{3})?\s*(?:€|EUR|k€|k\s*€|\s*Euro)(?:\s*-\s*\d{2,3}(?:\.\d{3})?\s*(?:€|EUR|k€|\s*Euro))?)/i) ||
                      text.match(/(\d{2,3}\s*000\s*-\s*\d{2,3}\s*000\s*€)/i);
  if (salaryMatch) {
    salaryInfo = salaryMatch[0].trim();
  }

  // 6. Anforderungsprofil extrahieren
  let requirementsProfile: string | null = null;
  const reqMatch = text.match(/(?:Dein Profil|Das bringst du mit|Anforderungen|Ihr Profil|Qualifikationen|Was du mitbringst)[\s:]*([\s\S]{30,600}?)(?:\n\s*\n|Wir bieten|Deine Aufgaben|Benefits|Kontakt|$)/i);
  if (reqMatch && reqMatch[1]) {
    requirementsProfile = reqMatch[1]
      .split(/\r?\n/)
      .map((s) => s.replace(/^[-*•]\s*/, "").trim())
      .filter((s) => s.length > 5)
      .slice(0, 5)
      .join(", ");
  }

  return {
    title,
    companyName,
    location,
    remote,
    techStack: Array.from(foundTech),
    salaryInfo,
    requirementsProfile,
    description: text.slice(0, 1000),
  };
}
