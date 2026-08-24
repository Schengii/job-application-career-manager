// -----------------------------------------------------------------------------
// Anschreiben- & Kommunikations-Generator (inkl. Multi-Tone & Follow-Up)
// -----------------------------------------------------------------------------
// Erstellt maßgeschneiderte Anschreiben & Nachfass-E-Mails auf Basis von:
//   - Unternehmensdaten (Name, Adresse, Ansprechpartner)
//   - Stellenangebot (Titel, Anforderungsprofil, Tech-Stack) — optional
//   - Bewerberprofil (Präferenzen, Ausbildungs-/Umschulungsdaten, Projekte)
// Unterstützt 4 Tonalitäten: MODERN, CLASSIC, STARTUP, DETAILED.
// -----------------------------------------------------------------------------

export type CoverLetterTone = "MODERN" | "CLASSIC" | "STARTUP" | "DETAILED";

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

export function today(): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());
}

function findEntry(entries: CoverLetterEducationEntry[], type: string) {
  return entries.find((e) => e.type === type);
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

/** Ermittelt die Schnittmenge aus Profil-Tech-Stack und Job-Anforderungen */
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
  tone?: CoverLetterTone;
  highlightProjectTitle?: string | null;
}): string {
  const { company, job, profile, position, tone = "MODERN", highlightProjectTitle } = params;

  const ausbildung = findEntry(profile.educationEntries, "AUSBILDUNG");
  const umschulung = findEntry(profile.educationEntries, "UMSCHULUNG");
  
  const project = highlightProjectTitle
    ? profile.projectEntries.find((p) => p.title === highlightProjectTitle) ?? profile.projectEntries[0]
    : profile.projectEntries[0];

  const skills = relevantSkills(profile.techStack, job);

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

  // --- TONALITÄTEN ---
  let introParagraph = "";
  let backgroundParagraph = "";
  let projectParagraph = "";
  let closingParagraph = "";

  const projectDetails = project
    ? `Besonders stolz bin ich auf mein Projekt "${project.title}"${project.techStack ? ` (${project.techStack})` : ""}, ${ensureSentence(
        project.description ?? "in dem ich eigenständig eine vollständige Anwendung von der Konzeption bis zur Umsetzung realisiert habe",
      )} Dieses Projekt belegt meine Fähigkeit, komplexe Anforderungen selbstständig in funktionierende, nutzerfreundliche Software zu überführen.`
    : "";

  const jobFitSentence = job?.requirementsProfile
    ? `Die von Ihnen beschriebenen Anforderungen decken sich optimal mit meinem Profil: ${ensureSentence(job.requirementsProfile)}`
    : profile.profileSummary
      ? ensureSentence(profile.profileSummary)
      : "";

  switch (tone) {
    case "CLASSIC":
      introParagraph = `hiermit bewerbe ich mich mit großem Interesse auf die von Ihnen ausgeschriebene Position als ${position}. Als qualifizierter ${profile.desiredRole} mit fundierten Kenntnissen in modernen Webtechnologien möchte ich mein Wissen und Engagement gewinnbringend in Ihr Unternehmen einbringen.`;
      backgroundParagraph = [
        ausbildung ? `Meinen beruflichen Werdegang begann ich mit einer Ausbildung ${ausbildung.title.includes("Ausbildung") ? "" : "zum "}${ausbildung.title}${ausbildung.institution ? ` bei ${ausbildung.institution}` : ""}, wodurch ich eine strukturierte und gewissenhafte Arbeitsweise verinnerlicht habe.` : "",
        umschulung ? `Im Rahmen meiner Umschulung ${umschulung.title.toLowerCase().includes("umschulung") ? "" : "zur "}${umschulung.title}${umschulung.institution ? ` bei ${umschulung.institution}` : ""} habe ich meine Leidenschaft für die Softwareentwicklung professionalisiert und mir tiefgehende Kenntnisse in ${skills.join(", ")} erarbeitet.` : "",
      ].filter(Boolean).join(" ");
      projectParagraph = [projectDetails, jobFitSentence].filter(Boolean).join(" ");
      closingParagraph = `Über die Gelegenheit, mich Ihnen in einem persönlichen Vorstellungsgespräch vorzustellen und Sie von meiner Eignung zu überzeugen, freue ich mich sehr.`;
      break;

    case "STARTUP":
      introParagraph = `Ihre Ausschreibung für die Rolle als "${position}" bei ${company.name} hat mich sofort begeistert. Als praxisorientierter ${profile.desiredRole} brenne ich für moderne Frontend-Architekturen und möchte aktiv dazu beitragen, mit ${skills.join(", ")} erstklassige digitale Produkte für Ihr Team zu entwickeln.`;
      backgroundParagraph = [
        "Meine Stärke liegt im schnellen Einarbeiten in neue Technologien und im Finden pragmatischer, wartbarer Lösungen.",
        umschulung ? `Mit dem gezielten Fokus auf Anwendungsentwicklung bringe ich frische Motivation, saubere Code-Standards und echte Begeisterung für nutzerzentrierte Web-Apps mit.` : "",
      ].filter(Boolean).join(" ");
      projectParagraph = [projectDetails, jobFitSentence].filter(Boolean).join(" ");
      closingParagraph = `Lassen Sie uns gerne in einem Kennenlerngespräch darüber austauschen, wie ich Ihr Team ab sofort tatkräftig unterstützen kann.`;
      break;

    case "DETAILED":
      introParagraph = `mit großem Enthusiasmus bewerbe ich mich bei ${company.name} als ${position}. Mit meinem Profil als ${profile.desiredRole} bringe ich die ideale Kombination aus handwerklich präziser Denkweise, solider technischer Ausbildung und fundierter Expertise in ${skills.join(", ")} mit.`;
      backgroundParagraph = [
        ausbildung ? `Fundiertes technisches Verständnis, Prozessdisziplin und lösungsorientiertes Denken wurden bereits während meiner ersten Ausbildung ${ausbildung.title.includes("Ausbildung") ? "" : "zum "}${ausbildung.title} fest verankert.` : "",
        umschulung ? `Die zielgerichtete Umschulung ${umschulung.title.toLowerCase().includes("umschulung") ? "" : "zur "}${umschulung.title} ermöglichte mir eine intensive Vertiefung in Fullstack- und Frontend-Entwicklung (TypeScript, React, moderne CSS-Frameworks & REST/API-Design).` : "",
      ].filter(Boolean).join(" ");
      projectParagraph = [
        projectDetails,
        "Besonderen Wert lege ich auf modulare Komponenten, saubere Typisierung, Performance-Optimierung und intuitive UI/UX.",
        jobFitSentence,
      ].filter(Boolean).join(" ");
      closingParagraph = `Ich freue mich darauf, meine Fähigkeiten zeitnah in Ihre aktuellen Projekte einzubringen und überzeuge Sie gerne persönlich von meinen Qualifikationen.`;
      break;

    case "MODERN":
    default:
      introParagraph = `mit großem Interesse habe ich Ihre Stellenanzeige für die Position "${position}" gelesen. Als ${profile.desiredRole} mit Schwerpunkt Frontend-Entwicklung möchte ich mich bei ${company.name} bewerben und meine Erfahrung im Umgang mit ${skills.join(", ")} in Ihr Team einbringen.`;
      backgroundParagraph = [
        ausbildung ? `Meine berufliche Laufbahn habe ich mit der Ausbildung ${ausbildung.title.includes("Ausbildung") ? "" : "zum "}${ausbildung.title}${ausbildung.institution ? ` bei ${ausbildung.institution}` : ""} begonnen und dabei ein solides technisches Grundverständnis sowie eine strukturierte, präzise Arbeitsweise entwickelt.` : "",
        umschulung ? `Durch die anschließende Umschulung ${umschulung.title.toLowerCase().includes("umschulung") ? "" : "zur "}${umschulung.title}${umschulung.institution ? ` bei ${umschulung.institution}` : ""} habe ich mich konsequent in Richtung Softwareentwicklung weiterentwickelt und mir fundierte Kenntnisse in ${skills.join(", ")} angeeignet.` : "",
      ].filter(Boolean).join(" ");
      projectParagraph = [projectDetails, jobFitSentence].filter(Boolean).join(" ");
      closingParagraph = `Ich bringe eine hohe Lernbereitschaft, Teamfähigkeit und Freude an der Entwicklung moderner, nutzerfreundlicher Web-Anwendungen mit. Gerne überzeuge ich Sie in einem persönlichen Gespräch von meiner Motivation und meinen Fähigkeiten.`;
      break;
  }

  const paragraphs = [
    introParagraph,
    backgroundParagraph,
    projectParagraph,
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
