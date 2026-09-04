// -----------------------------------------------------------------------------
// ATS (Applicant Tracking System) Checker & Resume Optimizer
// -----------------------------------------------------------------------------
// Analysiert einen Lebenslauf und ein Anschreiben auf ATS-Kompatibilität,
// Keyword-Dichte, Lesbarkeit, typische Stolperfallen und Formatierungsregeln.
// -----------------------------------------------------------------------------
import { PreferencesWithProfile } from "@/types";

export interface AtsCheckResult {
  overallScore: number; // 0 - 100
  rating: "OPTIMAL" | "GUT" | "VERBESSERUNGSWÜRDIG" | "KRITISCH";
  breakdown: {
    keywordMatch: number; // 0 - 100
    sectionCompleteness: number; // 0 - 100
    contactClarity: number; // 0 - 100
    formattingReadability: number; // 0 - 100
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
  atsWarnings: string[];
}

export interface AtsCheckInput {
  preferences: PreferencesWithProfile;
  targetJobTechStack?: string | null;
  targetJobDescription?: string | null;
}

export function evaluateAtsCompatibility(input: AtsCheckInput): AtsCheckResult {
  const { preferences, targetJobTechStack, targetJobDescription } = input;
  const recommendations: string[] = [];
  const atsWarnings: string[] = [];

  // 1. Kontakt- und Basisdaten prüfen (25%)
  let contactScore = 100;
  if (!preferences.fullName) {
    contactScore -= 30;
    atsWarnings.push("Vollständiger Name fehlt im Profil.");
  }
  if (!preferences.email || !preferences.email.includes("@")) {
    contactScore -= 30;
    atsWarnings.push("Gültige E-Mail-Adresse fehlt.");
  }
  if (!preferences.phone) {
    contactScore -= 20;
    recommendations.push("Telefonnummer für Rückfragen hinterlegen.");
  }
  if (!preferences.city) {
    contactScore -= 20;
    recommendations.push("Wohnort/Region für Standort-Filter angeben.");
  }
  contactScore = Math.max(0, contactScore);

  // 2. Sektionen & Vollständigkeit (25%)
  let sectionScore = 100;
  if (!preferences.educationEntries || preferences.educationEntries.length === 0) {
    sectionScore -= 40;
    atsWarnings.push("Keine Bildungs-/Umschulungseinträge hinterlegt.");
  }
  if (!preferences.projectEntries || preferences.projectEntries.length === 0) {
    sectionScore -= 30;
    recommendations.push("Mindestens 1-2 Praxisprojekte (z. B. electroCheck-ai) mit Tech-Stack aufführen.");
  }
  if (!preferences.profileSummary || preferences.profileSummary.trim().length < 30) {
    sectionScore -= 30;
    recommendations.push("Ein prägnantes 2-3 zeiliges Kurzprofil erhöht die Lesbarkeit für Recruiter.");
  }
  sectionScore = Math.max(0, sectionScore);

  // 3. Keyword Match gegen Zielstelle (30%)
  const userTechs = (preferences.techStack || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  let targetTechs: string[] = [];
  if (targetJobTechStack) {
    targetTechs = targetJobTechStack.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  } else if (targetJobDescription) {
    // Einfache Extraktion gängiger Web-Techs
    const checkList = ["typescript", "javascript", "react", "next.js", "tailwind", "css", "html", "rest", "git", "node.js"];
    const desc = targetJobDescription.toLowerCase();
    targetTechs = checkList.filter((k) => desc.includes(k));
  } else {
    targetTechs = ["typescript", "react", "css", "javascript", "html"];
  }

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const t of targetTechs) {
    if (userTechs.some((u) => u.includes(t) || t.includes(u))) {
      matchedKeywords.push(t);
    } else {
      missingKeywords.push(t);
    }
  }

  const keywordMatch = targetTechs.length > 0
    ? Math.round((matchedKeywords.length / targetTechs.length) * 100)
    : 100;

  if (missingKeywords.length > 0) {
    recommendations.push(`Fehlende Ziel-Keywords im Profil ergänzen: ${missingKeywords.join(", ")}`);
  }

  // 4. Formatierung & ATS-Lesbarkeit (20%)
  let formatScore = 100;
  // Prüfe auf Sonderzeichen / Icons im Namen oder Profil
  if (preferences.fullName && /[^\w\säöüÄÖÜß\-\.]/.test(preferences.fullName)) {
    formatScore -= 20;
    atsWarnings.push("Sonderzeichen oder Emojis im Namen können ATS-Parser verwirren.");
  }
  formatScore = Math.max(0, formatScore);

  // Gesamt-Score gewichten
  const overallScore = Math.round(
    keywordMatch * 0.35 +
    sectionCompletenessWeight(sectionScore) * 0.25 +
    contactScore * 0.25 +
    formatScore * 0.15
  );

  let rating: AtsCheckResult["rating"] = "OPTIMAL";
  if (overallScore < 50) rating = "KRITISCH";
  else if (overallScore < 70) rating = "VERBESSERUNGSWÜRDIG";
  else if (overallScore < 85) rating = "GUT";

  return {
    overallScore,
    rating,
    breakdown: {
      keywordMatch,
      sectionCompleteness: sectionScore,
      contactClarity: contactScore,
      formattingReadability: formatScore,
    },
    matchedKeywords,
    missingKeywords,
    recommendations,
    atsWarnings,
  };
}

function sectionCompletenessWeight(score: number): number {
  return score;
}
