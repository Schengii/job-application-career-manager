// -----------------------------------------------------------------------------
// Anschreiben- & Kommunikations-Generator (fester Vorlagentext + Follow-Up)
// -----------------------------------------------------------------------------
// Erstellt Anschreiben nach einem festen, vom Nutzer in den Einstellungen
// hinterlegten Vorlagentext (Preferences.standardCoverLetterBody) — bewusst
// KEINE pro Bewerbung neu komponierte Tonalität/Projekt-Hervorhebung mehr
// (frühere Versionen dieses Generators variierten Werdegang-/Projekt-/
// Abschlussabsatz je nach Tonalität und Stellenanzeige). Nur die folgenden
// vier Teile werden je Bewerbung ausgetauscht, der Rest bleibt IMMER gleich:
//   1. Empfänger-Adresse (Unternehmen)
//   2. Bewerbungsdatum
//   3. Anrede (aus dem hinterlegten Ansprechpartner)
//   4. Einleitungssatz — individuell, warum genau DIESES Unternehmen/DIESE
//      Position (siehe generateOpeningSentenceWithAI() in aiService.ts, mit
//      Platzhalter-Vorlage als Fallback ohne konfigurierten KI-Provider)
// Ein pro Unternehmen hinterlegter Einstiegsabsatz (Company.letterTemplate)
// überschreibt weiterhin gezielt nur den Einleitungssatz — der feste
// Haupttext (Werdegang, Projekt, Abschluss) bleibt davon unberührt.
// -----------------------------------------------------------------------------
import { generateOpeningSentenceWithAI } from "@/lib/settings/aiService";

export type CoverLetterCompany = {
  name: string;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  contactName?: string | null;
  // Freitext-Notizen zum Unternehmen (Company.notes) — fließen, falls
  // vorhanden, als Kontext in die KI-Generierung des Einleitungssatzes ein
  // (siehe generateOpeningSentenceWithAI()). Je mehr hier hinterlegt ist,
  // desto individueller kann der Satz ausfallen.
  notes?: string | null;
  // Eigener Einleitungssatz (siehe Company.letterTemplate) — ersetzt, falls
  // gesetzt, den automatisch erzeugten Einleitungssatz unten (weder KI noch
  // Vorlage). Der feste Haupttext bleibt davon unberührt.
  letterTemplate?: string | null;
};

export type CoverLetterJob = {
  title: string;
  techStack?: string | null;
  requirementsProfile?: string | null;
  description?: string | null;
} | null;

export type CoverLetterProfile = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  desiredRole: string;
  techStack: string;
  profileSummary?: string | null;
  // Der feste Anschreiben-Haupttext (Werdegang, Projekt(e), Abschluss) —
  // wird unverändert in jedes Anschreiben übernommen. Siehe Einstellungen →
  // Profil & Präferenzen. Leer/nicht gesetzt -> Platzhaltertext mit Hinweis,
  // den Text zu hinterlegen (siehe DEFAULT_BODY_PLACEHOLDER).
  standardCoverLetterBody?: string | null;
  // Vorlage für den Einleitungssatz mit den Platzhaltern {company}/{position}
  // — Fallback, wenn kein KI-Provider konfiguriert ist oder die
  // KI-Generierung fehlschlägt. Siehe Einstellungen → Profil & Präferenzen.
  coverLetterOpeningSentence?: string | null;
  // KI-Provider-Konfiguration (siehe src/lib/aiService.ts) — wird für den
  // individuellen, unternehmensspezifischen Einleitungssatz genutzt.
  aiProvider?: string | null;
  aiApiKey?: string | null;
  aiModel?: string | null;
};

export function today(): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());
}

/** Stellt sicher, dass ein Satzfragment mit einem Satzzeichen endet */
export function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/** Baut eine grammatikalisch korrekte Anrede aus dem Ansprechpartner-Namen */
export function buildSalutation(contactName: string | null | undefined): string {
  if (!contactName?.trim()) return "Sehr geehrte Damen und Herren,";

  const [genderWord, ...rest] = contactName.trim().split(/\s+/);
  const gender = genderWord.toLowerCase();
  if (gender !== "frau" && gender !== "herr" || rest.length === 0) {
    return "Sehr geehrte Damen und Herren,";
  }

  const titles = rest.filter((w) => w.endsWith("."));
  const givenAndSurnames = rest.filter((w) => !w.endsWith("."));
  const surname = givenAndSurnames[givenAndSurnames.length - 1] ?? rest[rest.length - 1];
  const nameForSalutation = [...titles, surname].join(" ");

  return `Sehr geehrte${gender === "herr" ? "r" : ""} ${genderWord} ${nameForSalutation},`;
}

const DEFAULT_OPENING_TEMPLATE =
  "mit großem Interesse habe ich Ihre Stellenanzeige für die Position als {position} bei {company} gelesen.";
const DEFAULT_BODY_PLACEHOLDER =
  "[Noch kein fester Anschreiben-Text hinterlegt — trage ihn unter Einstellungen → Profil & Präferenzen ein, damit er automatisch in jedes Anschreiben übernommen wird.]";

/** Ersetzt {company}/{position} in der Einleitungssatz-Vorlage. */
export function renderOpeningSentence(template: string | null | undefined, company: string, position: string): string {
  const base = template?.trim() || DEFAULT_OPENING_TEMPLATE;
  return ensureSentence(base.replaceAll("{company}", company).replaceAll("{position}", position));
}

export type GenerateCoverLetterResult = {
  content: string;
  /** Ob der Einleitungssatz per KI (statt der Platzhalter-Vorlage) erzeugt wurde. */
  usedAiForOpening: boolean;
};

/**
 * @param useAi Standardmäßig `true` — pro Bewerbung wird versucht, den
 *   Einleitungssatz individuell per KI zu formulieren (siehe
 *   generateOpeningSentenceWithAI()), mit der Platzhalter-Vorlage als
 *   Fallback ohne konfigurierten Provider oder bei einem Fehler. Für
 *   Massenaktionen (z.B. den Bulk-„Standardpaket anwenden") bewusst auf
 *   `false` setzbar, um nicht pro Bewerbung einen (langsamen/kostenpflichtigen)
 *   KI-Request auszulösen — dort greift dann direkt die Vorlage.
 */
export async function generateCoverLetter(params: {
  company: CoverLetterCompany;
  job?: CoverLetterJob;
  profile: CoverLetterProfile;
  position: string;
  useAi?: boolean;
}): Promise<GenerateCoverLetterResult> {
  const { company, job, profile, position, useAi = true } = params;

  const senderBlock = [
    profile.fullName,
    profile.street,
    [profile.postalCode, profile.city].filter(Boolean).join(" "),
    profile.email,
    profile.phone,
  ]
    .filter(Boolean)
    .join("\n");

  const recipientBlock = [
    company.name,
    company.contactName ? `z. Hd. ${company.contactName}` : null,
    company.street,
    [company.postalCode, company.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join("\n");

  const salutation = buildSalutation(company.contactName);

  // Ein pro Unternehmen hinterlegter Einstiegsabsatz (Company.letterTemplate)
  // hat weiterhin Vorrang vor jeder Automatik (weder KI noch Vorlage) — der
  // feste Haupttext (nächster Absatz) bleibt in jedem Fall unberührt.
  let openingSentence: string | null = company.letterTemplate?.trim()
    ? ensureSentence(company.letterTemplate.trim())
    : null;
  let usedAiForOpening = false;

  if (!openingSentence && useAi) {
    const aiResult = await generateOpeningSentenceWithAI({
      companyName: company.name,
      companyNotes: company.notes,
      position,
      jobDescription: job?.description,
      jobRequirementsProfile: job?.requirementsProfile,
      jobTechStack: job?.techStack,
      profileTechStack: profile.techStack,
      provider: profile.aiProvider,
      apiKey: profile.aiApiKey,
      model: profile.aiModel,
    });
    if (aiResult.sentence) {
      openingSentence = ensureSentence(aiResult.sentence);
      usedAiForOpening = true;
    }
  }

  if (!openingSentence) {
    openingSentence = renderOpeningSentence(profile.coverLetterOpeningSentence, company.name, position);
  }

  const body = profile.standardCoverLetterBody?.trim() || DEFAULT_BODY_PLACEHOLDER;

  const content = [
    senderBlock,
    "",
    recipientBlock,
    "",
    today(),
    "",
    `Bewerbung als ${position}`,
    "",
    salutation,
    "",
    `${openingSentence}\n`,
    `${body}\n`,
    "Mit freundlichen Grüßen",
    profile.fullName ?? "",
  ].join("\n");

  return { content, usedAiForOpening };
}

/**
 * Erstellt eine professionelle, höfliche Nachfass-E-Mail
 */
export function generateFollowUpEmail(params: {
  company: CoverLetterCompany;
  position: string;
  applicationDate?: Date | string | null;
  profile: CoverLetterProfile;
}): { subject: string; body: string } {
  const { company, position, applicationDate, profile } = params;
  const salutation = buildSalutation(company.contactName);

  const formattedDate = applicationDate
    ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(applicationDate))
    : "vor einigen Tagen";

  const subject = `Nachfrage zu meiner Bewerbung als ${position} – ${profile.fullName ?? "Bewerbung"}`;

  const body = [
    salutation,
    "",
    `am ${formattedDate} habe ich Ihnen meine Bewerbungsunterlagen für die Position als ${position} zukommen lassen. Da mich die Aufgaben bei ${company.name} und Ihr Tätigkeitsfeld nach wie vor sehr ansprechen, möchte ich mich heute kurz nach dem aktuellen Stand des Auswahlverfahrens erkundigen.`,
    "",
    `Sollten Sie noch zusätzliche Informationen oder Dokumente von meiner Seite benötigen, stehe ich Ihnen jederzeit sehr gerne zur Verfügung.`,
    "",
    `Ich freue mich weiterhin auf eine Rückmeldung und die Gelegenheit zu einem persönlichen Austausch.`,
    "",
    "Mit freundlichen Grüßen,",
    profile.fullName ?? "",
    profile.phone ? `Tel.: ${profile.phone}` : null,
    profile.email ? `E-Mail: ${profile.email}` : null,
  ].filter((l) => l !== null).join("\n");

  return { subject, body };
}
