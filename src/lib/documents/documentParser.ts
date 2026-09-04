// -----------------------------------------------------------------------------
// Dokument- & PDF-Zeugnis-Parser (Keyword- & Zertifikats-Analyse)
// -----------------------------------------------------------------------------
// Analysiert hochgeladene Zeugnisse, Zertifikate und Nachweise anhand von Dateinamen
// und extrahiertem Text, um Kategorie, erkannte Tech-Skills und Noten vorschlagen zu können.
// -----------------------------------------------------------------------------
import type { DocumentCategory } from "@/lib/core/constants";

export type ParsedDocumentInsights = {
  suggestedCategory: DocumentCategory;
  detectedSkills: string[];
  detectedGrade?: string;
  detectedInstitution?: string;
  isIhkCertificate: boolean;
  summary: string;
};

const KNOWN_SKILL_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "React", regex: /\bReact(?:\.js)?\b/i },
  { name: "TypeScript", regex: /\bTypeScript|TS\b/i },
  { name: "JavaScript", regex: /\bJavaScript|JS\b/i },
  { name: "Next.js", regex: /\bNext(?:\.js)?\b/i },
  { name: "Tailwind CSS", regex: /\bTailwind(?:\s*CSS)?\b/i },
  { name: "Node.js", regex: /\bNode(?:\.js)?\b/i },
  { name: "SQL", regex: /\b(?:PostgreSQL|MySQL|SQLite|SQL)\b/i },
  { name: "REST API", regex: /\bREST(?:\s*API)?\b/i },
  { name: "GraphQL", regex: /\bGraphQL\b/i },
  { name: "Docker", regex: /\bDocker\b/i },
  { name: "Git", regex: /\bGit(?:Hub|Lab)?\b/i },
  { name: "Scrum", regex: /\b(?:Scrum|Agil|Kanban)\b/i },
  { name: "Clean Code", regex: /\b(?:Clean Code|Refactoring|Testing)\b/i },
  { name: "Fachinformatiker AE", regex: /\b(?:Fachinformatiker|Anwendungsentwicklung)\b/i },
];

export function analyzeDocumentContent(
  fileName: string,
  rawText?: string | null
): ParsedDocumentInsights {
  const combined = `${fileName} ${rawText || ""}`.toLowerCase();

  // 1. Kategorie-Erkennung
  let suggestedCategory: DocumentCategory = "SONSTIGES";
  if (
    combined.includes("lebenslauf") ||
    combined.includes("cv") ||
    combined.includes("resume")
  ) {
    suggestedCategory = "LEBENSLAUF";
  } else if (
    combined.includes("arbeitszeugnis") ||
    combined.includes("zwischenzeugnis") ||
    combined.includes("dienstzeugnis") ||
    combined.includes("empfehlung") ||
    combined.includes("referenz")
  ) {
    suggestedCategory = "REFERENZ";
  } else if (
    combined.includes("umschulung") ||
    combined.includes("fachinformatiker")
  ) {
    suggestedCategory = "ZEUGNIS_UMSCHULUNG";
  } else if (
    combined.includes("elektroniker") ||
    combined.includes("ausbildung") ||
    combined.includes("gesellenbrief")
  ) {
    suggestedCategory = "ZEUGNIS_AUSBILDUNG";
  } else if (
    combined.includes("zeugnis") ||
    combined.includes("urkunde") ||
    combined.includes("abschluss") ||
    combined.includes("ihk")
  ) {
    suggestedCategory = "ZEUGNIS_UMSCHULUNG";
  }

  // 2. IHK- & Institution-Erkennung
  const isIhkCertificate =
    combined.includes("ihk") ||
    combined.includes("industrie- und handelskammer") ||
    combined.includes("fachinformatiker");

  let detectedInstitution: string | undefined;
  if (isIhkCertificate) {
    detectedInstitution = "IHK (Industrie- und Handelskammer)";
  } else if (combined.includes("bfw") || combined.includes("berufsförderungswerk")) {
    detectedInstitution = "BFW (Berufsförderungswerk)";
  } else if (combined.includes("tüv") || combined.includes("tuv")) {
    detectedInstitution = "TÜV Rheinland";
  }

  // 3. Noten-Erkennung (z.B. "sehr gut", "gut", "1,2", "88 Punkte")
  let detectedGrade: string | undefined;
  const gradeMatch =
    combined.match(/(?:note|gesamtnote|ergebnis|bewertung):\s*([0-9],[0-9]|sehr gut|gut|befriedigend)/i) ||
    combined.match(/\b([1-2],[0-9])\b/);

  if (gradeMatch) {
    detectedGrade = gradeMatch[1];
  } else if (combined.includes("sehr gut") || combined.includes("mit auszeichnung")) {
    detectedGrade = "Sehr gut";
  } else if (combined.includes("gut bestanden") || combined.includes("überdurchschnittlich")) {
    detectedGrade = "Gut";
  }

  // 4. Erkannte Skills
  const detectedSkills: string[] = [];
  for (const item of KNOWN_SKILL_PATTERNS) {
    if (item.regex.test(combined)) {
      detectedSkills.push(item.name);
    }
  }

  // 5. Zusammenfassung generieren
  let summary = `Dokument '${fileName}' erkannt.`;
  if (isIhkCertificate) {
    summary = `IHK-Abschlusszeugnis (Fachinformatiker Anwendungsentwicklung) mit Schwerpunkt moderne Softwareentwicklung.`;
  } else if (suggestedCategory === "REFERENZ") {
    summary = `Arbeitszeugnis / Leistungsreferenz mit Praxisbezug.`;
  } else if (detectedSkills.length > 0) {
    summary = `Nachweis über Fachkenntnisse in ${detectedSkills.slice(0, 3).join(", ")}.`;
  }

  return {
    suggestedCategory,
    detectedSkills,
    detectedGrade,
    detectedInstitution,
    isIhkCertificate,
    summary,
  };
}
