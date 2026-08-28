// -----------------------------------------------------------------------------
// Follow-up / Wiedervorlage-Engine
// -----------------------------------------------------------------------------
// Berechnet den Status von Fristen, überfälligen Terminen und empfiehlt
// proaktives Nachfassen bei Bewerbungen ohne Rückmeldung.
// -----------------------------------------------------------------------------

export const FOLLOW_UP_THRESHOLD_DAYS = 14; // Nach 14 Tagen ohne Rückmeldung Nachfassen empfehlen

export type FollowUpStatus = {
  daysSinceApplication: number | null;
  isFollowUpSuggested: boolean;
  isOverdue: boolean;
  isDueSoon: boolean;
  daysUntilNextStep: number | null;
};

export function getFollowUpStatus(app: {
  status: string;
  applicationDate?: Date | string | null;
  nextStepDate?: Date | string | null;
}): FollowUpStatus {
  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let daysSinceApplication: number | null = null;
  if (app.applicationDate) {
    const appDate = new Date(app.applicationDate);
    const appMs = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate()).getTime();
    daysSinceApplication = Math.max(0, Math.floor((todayMs - appMs) / (1000 * 60 * 60 * 24)));
  }

  let daysUntilNextStep: number | null = null;
  let isOverdue = false;
  let isDueSoon = false;

  if (app.nextStepDate) {
    const stepDate = new Date(app.nextStepDate);
    const stepMs = new Date(stepDate.getFullYear(), stepDate.getMonth(), stepDate.getDate()).getTime();
    daysUntilNextStep = Math.round((stepMs - todayMs) / (1000 * 60 * 60 * 24));
    if (daysUntilNextStep < 0) {
      isOverdue = true;
    } else if (daysUntilNextStep <= 3) {
      isDueSoon = true;
    }
  }

  // Nachfassen wird nur für versendete Bewerbungen ohne Folgestatus (DRAFT, INTERVIEW, OFFER, REJECTED, WITHDRAWN) empfohlen
  const isFollowUpSuggested =
    app.status === "SENT" &&
    daysSinceApplication !== null &&
    daysSinceApplication >= FOLLOW_UP_THRESHOLD_DAYS;

  return {
    daysSinceApplication,
    isFollowUpSuggested,
    isOverdue,
    isDueSoon,
    daysUntilNextStep,
  };
}

export type FollowUpScenario =
  | "AFTER_APPLICATION"
  | "AFTER_INTERVIEW"
  | "AFTER_TECH_TASK"
  | "FEEDBACK_REQUEST";

export type FollowUpEmailParams = {
  scenario: FollowUpScenario;
  companyName: string;
  contactName?: string | null;
  position: string;
  applicationDate?: Date | string | null;
  interviewDate?: Date | string | null;
  applicantName?: string | null;
  applicantPhone?: string | null;
};

export type GeneratedFollowUpEmail = {
  scenario: FollowUpScenario;
  scenarioTitle: string;
  subject: string;
  body: string;
  recommendedTiming: string;
};

export function generateScenarioFollowUpEmail(params: FollowUpEmailParams): GeneratedFollowUpEmail {
  const salutation = params.contactName?.trim()
    ? `Sehr geehrte(r) Frau/Herr ${params.contactName},`
    : `Sehr geehrte Damen und Herren,`;

  const applicant = params.applicantName || "Bewerber";
  const phonePart = params.applicantPhone ? ` | Tel: ${params.applicantPhone}` : "";

  const formattedDate = params.applicationDate
    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(params.applicationDate))
    : "vor einigen Tagen";

  switch (params.scenario) {
    case "AFTER_INTERVIEW":
      return {
        scenario: "AFTER_INTERVIEW",
        scenarioTitle: "Dankes-E-Mail nach dem Gespräch (am selben / Folgetag)",
        recommendedTiming: "24–48 Stunden nach dem Interview",
        subject: `Vielen Dank für das angenehme Gespräch – Bewerbung als ${params.position}`,
        body: `${salutation}

vielen Dank für das sehr informative und angenehme Gespräch am heutigen/gestrigen Tag bezüglich der Position als ${params.position} bei ${params.companyName}.

Der Einblick in Ihre aktuellen Frontend-Projekte und die Arbeitsweise Ihres Entwicklungsteams hat mein großes Interesse an der Stelle nochmals bestärkt. Ich bin überzeugt, dass ich meine Kenntnisse in moderner Frontend-Entwicklung (TypeScript, React, modulare Architekturen) gewinnbringend in Ihr Team einbringen kann.

Falls Sie noch weitere Unterlagen oder Arbeitsproben von mir benötigen, stehe ich Ihnen jederzeit gerne zur Verfügung.

Ich freue mich auf Ihre Rückmeldung zum weiteren Prozessverlauf.

Mit freundlichen Grüßen
${applicant}${phonePart}`,
      };

    case "AFTER_TECH_TASK":
      return {
        scenario: "AFTER_TECH_TASK",
        scenarioTitle: "Nachfrage nach Coding-Challenge / Tech-Assessment",
        recommendedTiming: "4–7 Tage nach Abgabe",
        subject: `Status-Nachfrage zur Coding Challenge / Probearbeit – ${params.position}`,
        body: `${salutation}

ich hoffe, Sie hatten eine gute Woche.

Vor einigen Tagen habe ich meine Bearbeitung der Coding Challenge für die Position als ${params.position} eingereicht. Ich wollte mich kurz nach dem aktuellen Stand erkundigen und fragen, ob noch offene Fragen zu meinem Code oder meinen Lösungsansätzen bestehen.

Ich stehe Ihnen gerne jederzeit für ein kurzes Review-Gespräch zur Verfügung.

Mit freundlichen Grüßen
${applicant}${phonePart}`,
      };

    case "FEEDBACK_REQUEST":
      return {
        scenario: "FEEDBACK_REQUEST",
        scenarioTitle: "Professionelle Feedback-Anfrage nach Absage",
        recommendedTiming: "1–3 Tage nach Erhalt der Absage",
        subject: `Rückfrage zum Auswahlverfahren – Bewerbung als ${params.position}`,
        body: `${salutation}

vielen Dank für Ihre Rückmeldung bezüglich meiner Bewerbung als ${params.position}. Auch wenn ich die Entscheidung bedauere, bedanke ich mich für die Zeit und das Interesse an meinem Profil.

Um mich für meinen weiteren Karriereweg als Frontend-Entwickler kontinuierlich zu verbessern, wäre ich Ihnen für ein kurzes, offenes Feedback sehr dankbar: Gab es bestimmte Qualifikationen oder Aspekte, die den Ausschlag für einen anderen Kandidaten gegeben haben?

Ich wünsche ${params.companyName} weiterhin viel Erfolg bei der Besetzung der Position.

Mit besten Grüßen
${applicant}${phonePart}`,
      };

    case "AFTER_APPLICATION":
    default:
      return {
        scenario: "AFTER_APPLICATION",
        scenarioTitle: "Freundliche Nachfrage (7–14 Tage ohne Rückmeldung)",
        recommendedTiming: "7–14 Tage nach dem Absenden",
        subject: `Nachfrage zu meiner Bewerbung als ${params.position}`,
        body: `${salutation}

am ${formattedDate} habe ich Ihnen meine Bewerbungsunterlagen für die Position als ${params.position} zukommen lassen.

Da ich weiterhin großes Interesse an einer Zusammenarbeit mit ${params.companyName} habe und mein Profil mit modernem TypeScript- und React-Stack ideal zu Ihren Anforderungen passt, möchte ich mich kurz nach dem aktuellen Stand des Auswahlprozesses erkundigen.

Über eine kurze Rückmeldung würde ich mich sehr freuen.

Mit freundlichen Grüßen
${applicant}${phonePart}`,
      };
  }
}

