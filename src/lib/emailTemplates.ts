// -----------------------------------------------------------------------------
// E-Mail-Vorlagen-Manager mit dynamischen Platzhaltern
// -----------------------------------------------------------------------------

export type EmailTemplateId =
  | "INITIAL_APPLICATION"
  | "FOLLOW_UP_FRIENDLY"
  | "INTERVIEW_THANK_YOU"
  | "ACCEPT_INTERVIEW"
  | "REJECTION_FEEDBACK";

export type EmailTemplate = {
  id: EmailTemplateId;
  name: string;
  category: "Bewerbung" | "Interview" | "Nachfassen" | "Absage";
  subject: string;
  body: string;
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "INITIAL_APPLICATION",
    name: "Bewerbung mit Unterlagen im Anhang",
    category: "Bewerbung",
    subject: "Bewerbung als {position} – {myFullName}",
    body: `Sehr geehrte/r {contactName},

mit großem Interesse bewerbe ich mich bei Ihnen als {position}.

Als Fachinformatiker für Anwendungsentwicklung mit Schwerpunkt auf moderner Web- und Frontend-Entwicklung (TypeScript, React, Next.js) begeistern mich Ihre aktuellen Projekte und die technologische Ausrichtung von {company}.

Anbei erhalten Sie mein Anschreiben sowie meine vollständigen Bewerbungsunterlagen (inkl. Lebenslauf und Zeugnissen) als zusammengefasste PDF-Datei.

Über die Gelegenheit, mich Ihnen in einem persönlichen Gespräch vorzustellen, freue ich mich sehr.

Mit freundlichen Grüßen

{myFullName}`,
  },
  {
    id: "FOLLOW_UP_FRIENDLY",
    name: "Freundliche Nachfrage (10–14 Tage nach Versand)",
    category: "Nachfassen",
    subject: "Rückfrage zu meiner Bewerbung als {position} – {myFullName}",
    body: `Sehr geehrte/r {contactName},

vor rund zwei Wochen habe ich Ihnen meine Bewerbungsunterlagen für die Position als {position} zukommen lassen.

Da mich die Aufgaben bei {company} weiterhin sehr reizen, möchte ich mich kurz erkundigen, ob Sie bereits Gelegenheit hatten, meine Unterlagen zu sichten, oder ob Sie noch ergänzende Informationen von mir benötigen.

Ich freue mich auf Ihre Rückmeldung und wünsche Ihnen eine erfolgreiche Woche.

Beste Grüße

{myFullName}`,
  },
  {
    id: "INTERVIEW_THANK_YOU",
    name: "Dank & Re-Pitch nach Vorstellungsgespräch (24h)",
    category: "Interview",
    subject: "Vielen Dank für das angenehme Gespräch – {position}",
    body: `Sehr geehrte/r {contactName},

vielen Dank für das offene und fachlich sehr interessante Gespräch am gestrigen Tag.

Die Einblicke in Ihr Entwickler-Team und die aktuellen technischen Herausforderungen bei {company} haben mein Interesse an der Position als {position} nochmals bekräftigt. Besonders der Austausch über moderne Komponenten-Architektur und Performance-Optimierung hat mir viel Freude bereitet.

Falls Sie noch weitere Arbeitsproben oder Referenzen wünschen, stehe ich Ihnen jederzeit gern zur Verfügung.

Herzliche Grüße

{myFullName}`,
  },
  {
    id: "ACCEPT_INTERVIEW",
    name: "Terminzusage für Vorstellungsgespräch",
    category: "Interview",
    subject: "Terminbestätigung: Vorstellungsgespräch als {position}",
    body: `Sehr geehrte/r {contactName},

vielen Dank für die Einladung zum Vorstellungsgespräch. Über diese positive Rückmeldung habe ich mich sehr gefreut.

Den vorgeschlagenen Termin am {date} bestätige ich Ihnen hiermit sehr gerne.

Ich freue mich auf das persönliche Kennenlernen und den fachlichen Austausch mit Ihrem Team.

Mit besten Grüßen

{myFullName}`,
  },
  {
    id: "REJECTION_FEEDBACK",
    name: "Wertschätzende Feedback-Anfrage nach Absage",
    category: "Absage",
    subject: "Rückfrage zu meiner Bewerbung als {position} – {myFullName}",
    body: `Sehr geehrte/r {contactName},

vielen Dank für Ihre Rückmeldung zu meiner Bewerbung, auch wenn ich das Ergebnis natürlich bedauere.

Da mir meine kontinuierliche fachliche und persönliche Weiterentwicklung sehr wichtig ist, würde ich mich über ein kurzes, ehrliches Feedback freuen: Gab es bestimmte Qualifikationen oder Schwerpunkte, die bei Ihrer Entscheidung den Ausschlag gegeben haben?

Ich wünsche Ihnen und {company} weiterhin viel Erfolg bei der Besetzung der Stelle.

Mit freundlichen Grüßen

{myFullName}`,
  },
];

export function renderEmailTemplate(
  template: EmailTemplate,
  variables: {
    company: string;
    position: string;
    contactName?: string | null;
    myFullName?: string | null;
    date?: string | null;
  }
): { subject: string; body: string } {
  const contact = variables.contactName?.trim() || "Damen und Herren";
  const myName = variables.myFullName?.trim() || "Bewerber/in";
  const dateStr = variables.date?.trim() || "vereinbarten Termin";

  const replaceAll = (text: string) =>
    text
      .replaceAll("{company}", variables.company)
      .replaceAll("{position}", variables.position)
      .replaceAll("{contactName}", contact)
      .replaceAll("{myFullName}", myName)
      .replaceAll("{date}", dateStr);

  return {
    subject: replaceAll(template.subject),
    body: replaceAll(template.body),
  };
}
