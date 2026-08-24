// -----------------------------------------------------------------------------
// Anschreiben-Generator
// -----------------------------------------------------------------------------
// Erstellt ein maßgeschneidertes Anschreiben auf Basis von:
//   - Unternehmensdaten (Name, Adresse, Ansprechpartner)
//   - Stellenangebot (Titel, Anforderungsprofil, Tech-Stack) — optional
//   - Bewerberprofil (Präferenzen, Ausbildungs-/Umschulungsdaten, Projekte)
// Das Ergebnis ist reiner Text (kein HTML), der 1:1 als CoverLetter-Eintrag
// in der Datenbank gespeichert wird.
// -----------------------------------------------------------------------------

export type CoverLetterCompany = {
  name: string;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  contactName?: string | null;
};

export type CoverLetterJob = {
  title: string;
  techStack?: string | null;
  requirementsProfile?: string | null;
} | null;

export type CoverLetterEducationEntry = {
  type: string;
  title: string;
  institution?: string | null;
};

export type CoverLetterProjectEntry = {
  title: string;
  description?: string | null;
  techStack?: string | null;
};

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
  educationEntries: CoverLetterEducationEntry[];
  projectEntries: CoverLetterProjectEntry[];
};

function today(): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());
}

function findEntry(entries: CoverLetterEducationEntry[], type: string) {
  return entries.find((e) => e.type === type);
}

/** Stellt sicher, dass ein Satzfragment mit einem Satzzeichen endet, bevor es
 *  mit dem nächsten Satz zusammengefügt wird (verhindert "verbindet Dieses..."). */
function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/** Baut eine grammatikalisch korrekte Anrede aus dem Ansprechpartner-Namen.
 *  "Frau Dr. Julia Weber" -> "Sehr geehrte Frau Dr. Weber," (Vorname entfällt,
 *  Titel bleiben erhalten). Ohne erkennbares "Frau"/"Herr"-Präfix oder ohne
 *  Ansprechpartner wird die neutrale Standardanrede verwendet. */
function buildSalutation(contactName: string | null | undefined): string {
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

/** Ermittelt die Schnittmenge aus Profil-Tech-Stack und Job-Anforderungen für eine gezielte Ansprache. */
function relevantSkills(profileTechStack: string, job: CoverLetterJob): string[] {
  const profileSkills = profileTechStack.split(",").map((s) => s.trim()).filter(Boolean);
  if (!job) return profileSkills.slice(0, 4);

  const jobText = `${job.techStack ?? ""} ${job.requirementsProfile ?? ""}`.toLowerCase();
  const overlapping = profileSkills.filter((s) => jobText.includes(s.toLowerCase()));
  return (overlapping.length > 0 ? overlapping : profileSkills).slice(0, 5);
}

export function generateCoverLetter(params: {
  company: CoverLetterCompany;
  job: CoverLetterJob;
  profile: CoverLetterProfile;
  position: string;
}): string {
  const { company, job, profile, position } = params;

  const ausbildung = findEntry(profile.educationEntries, "AUSBILDUNG");
  const umschulung = findEntry(profile.educationEntries, "UMSCHULUNG");
  const project = profile.projectEntries[0];
  const skills = relevantSkills(profile.techStack, job);

  const senderBlock = [profile.fullName, profile.street, [profile.postalCode, profile.city].filter(Boolean).join(" "), profile.email, profile.phone]
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

  const introParagraph = `mit großem Interesse habe ich Ihre Stellenanzeige für die Position "${position}" gelesen. Als ${profile.desiredRole} mit Schwerpunkt Frontend-Entwicklung möchte ich mich bei ${company.name} bewerben und meine Erfahrung im Umgang mit ${skills.join(", ")} in Ihr Team einbringen.`;

  const backgroundSentences: string[] = [];
  if (ausbildung) {
    backgroundSentences.push(
      `Meine berufliche Laufbahn habe ich mit der Ausbildung ${ausbildung.title.includes("Ausbildung") ? "" : "zum "}${ausbildung.title}${ausbildung.institution ? ` bei ${ausbildung.institution}` : ""} begonnen und dabei ein solides technisches Grundverständnis sowie eine strukturierte, präzise Arbeitsweise entwickelt.`,
    );
  }
  if (umschulung) {
    backgroundSentences.push(
      `Durch die anschließende Umschulung ${umschulung.title.toLowerCase().includes("umschulung") ? "" : "zur "}${umschulung.title}${umschulung.institution ? ` bei ${umschulung.institution}` : ""} habe ich mich konsequent in Richtung Softwareentwicklung weiterentwickelt und mir fundierte Kenntnisse in ${profile.techStack.split(",").slice(0, 4).join(", ")} angeeignet.`,
    );
  }

  const backgroundParagraph = backgroundSentences.join(" ");

  const projectSentence = project
    ? `Besonders stolz bin ich auf mein Projekt "${project.title}"${project.techStack ? ` (${project.techStack})` : ""}, ${ensureSentence(
        project.description ?? "in dem ich eigenständig eine vollständige Anwendung von der Konzeption bis zur Umsetzung realisiert habe",
      )} Dieses Projekt zeigt, dass ich in der Lage bin, komplexe Anforderungen selbstständig in funktionierende, benutzerfreundliche Software umzusetzen.`
    : "";

  // Nur EINE der beiden Quellen verwenden, um redundante, aneinandergereihte
  // Sätze zu vermeiden: job-spezifische Anforderungen sind aussagekräftiger
  // als das generische Kurzprofil, wenn eine Stellenanzeige vorliegt.
  const closingContextSentence = job?.requirementsProfile
    ? `Die von Ihnen genannten Anforderungen decken sich sehr gut mit meinem Profil: ${ensureSentence(job.requirementsProfile)}`
    : profile.profileSummary
      ? ensureSentence(profile.profileSummary)
      : "";

  const closingParagraph = `Ich bringe eine hohe Lernbereitschaft, Teamfähigkeit und Freude an der Entwicklung moderner, nutzerfreundlicher Web-Anwendungen mit. Gerne überzeuge ich Sie in einem persönlichen Gespräch von meiner Motivation und meinen Fähigkeiten.`;

  const paragraphs = [
    introParagraph,
    backgroundParagraph,
    [projectSentence, closingContextSentence].filter(Boolean).join(" "),
    closingParagraph,
  ].filter((p) => p && p.trim().length > 0);

  return [
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
    ...paragraphs.map((p) => p + "\n"),
    "Mit freundlichen Grüßen",
    profile.fullName ?? "",
  ].join("\n");
}
