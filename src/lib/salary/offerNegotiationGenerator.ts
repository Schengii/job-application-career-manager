// -----------------------------------------------------------------------------
// Generator für professionelle Gehaltsverhandlungs-E-Mails & Gegenangebote
// -----------------------------------------------------------------------------
// Formuliert diplomatische, wertschätzende und durchsetzungsstarke
// Verhandlungs-Schreiben für Job-Angebote mit verschiedenen Verhandlungshebeln.
// -----------------------------------------------------------------------------

export type NegotiationScenario =
  | "HIGHER_BASE_SALARY"
  | "REMOTE_AND_PERKS"
  | "COMPETING_OFFER"
  | "SIGN_ON_BONUS";

export type NegotiationParams = {
  candidateName: string;
  recruiterName?: string;
  companyName: string;
  position: string;
  offeredSalary: number;
  targetSalary: number;
  scenario: NegotiationScenario;
  additionalPerks?: string[];
  competingSalary?: number;
};

export type GeneratedNegotiationEmail = {
  subject: string;
  body: string;
  tacticalAdvice: string;
};

export function generateOfferNegotiationEmail(params: NegotiationParams): GeneratedNegotiationEmail {
  const greeting = params.recruiterName
    ? `Sehr geehrte/r ${params.recruiterName},`
    : `Sehr geehrte Damen und Herren,`;

  const offeredFmt = params.offeredSalary.toLocaleString("de-DE") + " €";
  const targetFmt = params.targetSalary.toLocaleString("de-DE") + " €";

  let subject = "";
  let body = "";
  let tacticalAdvice = "";

  switch (params.scenario) {
    case "HIGHER_BASE_SALARY": {
      subject = `Rückmeldung zum Angebot für die Position ${params.position} – ${params.candidateName}`;
      body = `${greeting}

vielen Dank für das positive Feedback und das Angebot für die Position als ${params.position} bei ${params.companyName}. Die Gespräche mit Ihrem Team haben meinen Wunsch bestärkt, meine Kenntnisse in moderner Frontend-Entwicklung (React, TypeScript, Next.js) bei Ihnen einzubringen.

Ich habe das Angebot sorgfältig geprüft. Angesichts meiner praktischen Erfahrung in der Umsetzung skalierbarer Webanwendungen sowie meines IHK-Abschlusses als Fachinformatiker für Anwendungsentwicklung halte ich ein jährliches Brutto-Zielgehalt von ${targetFmt} für angemessen und marktgerecht.

Ich bin sehr an einer langfristigen Zusammenarbeit interessiert und zuversichtlich, dass wir einen gemeinsamen Rahmen finden, der für beide Seiten ideal passt. Wann passt Ihnen ein kurzes Gespräch zur Abstimmung?

Mit freundlichen Grüßen
${params.candidateName}`;
      tacticalAdvice =
        "Begründe die Forderung immer mit deinem direkten Mehrwert für das Team (z.B. sofortige Einsatzbereitschaft, saubere Code-Qualität) statt mit persönlichen Lebenshaltungskosten.";
      break;
    }

    case "REMOTE_AND_PERKS": {
      const perks = (params.additionalPerks || [
        "100% Homeoffice / Remote-Work",
        "Jährliches Weiterbildungs- & Konferenzbudget (z.B. React Summit)",
        "Jobticket / BahnCard",
      ]).join(", ");

      subject = `Vertragsdetails & Zusatzleistungen – ${params.position} bei ${params.companyName}`;
      body = `${greeting}

herzlichen Dank für das übermittelte Vertragsangebot für die Stelle als ${params.position}. Ich freue mich sehr über das entgegengebrachte Vertrauen.

Das angebotene Grundgehalt von ${offeredFmt} ist eine gute Basis. Um das Paket für beide Seiten optimal abzurunden, würde ich gerne noch über folgende Zusatzvereinbarungen sprechen:
- ${perks}

Lassen Sie uns dazu gerne in einem kurzen Telefonat abstimmen. Ich freue mich auf den weiteren Austausch!

Herzliche Grüße
${params.candidateName}`;
      tacticalAdvice =
        "Zusatzleistungen wie Weiterbildungsbudgets und Home-Office sind für Arbeitgeber oft budgetär einfacher umzusetzen als reines Fixgehalt.";
      break;
    }

    case "COMPETING_OFFER": {
      const competingFmt = (params.competingSalary || params.targetSalary).toLocaleString("de-DE") + " €";
      subject = `Rückmeldung zum Angebot & Abstimmung – ${params.position}`;
      body = `${greeting}

vielen Dank für das attraktive Angebot für die Position als ${params.position} bei ${params.companyName}.

Ihr Unternehmen und die fachlichen Herausforderungen sind mein klarer Favorit. Der Transparenz halber möchte ich Ihnen jedoch mitteilen, dass mir ein weiteres konkretes Vertragsangebot mit einer Vergütung von ${competingFmt} vorliegt.

Da ich mich fachlich und menschlich am stärksten bei ${params.companyName} sehe, würde ich mich freuen, wenn wir das Gehalt auf ${targetFmt} anpassen können, um die Entscheidung direkt finalisieren zu können.

Beste Grüße
${params.candidateName}`;
      tacticalAdvice =
        "Konkurrierende Angebote verleihen maximale Hebelwirkung, müssen jedoch sachlich und respektvoll kommuniziert werden, ohne erpresserisch zu wirken.";
      break;
    }

    case "SIGN_ON_BONUS": {
      subject = `Rückmeldung zum Vertragsangebot – Wechsel-Konditionen ${params.position}`;
      body = `${greeting}

vielen Dank für das Vertragsangebot zur Stelle als ${params.position}. Ich freue mich sehr über die Chance, Ihr Team tatkräftig zu verstärken.

Beim Übergang zum vorgeschlagenen Starttermin entfallen bei meinem bisherigen Beschäftigungsverhältnis anteilige Sonderzahlungen. Wäre ${params.companyName} bereit, diese Differenz über eine einmalige Wechselprämie (Sign-on-Bonus) oder eine gestaffelte Sonderzahlung auszugleichen?

Ich freue mich über eine kurze Rückmeldung.

Freundliche Grüße
${params.candidateName}`;
      tacticalAdvice =
        "Ein Sign-on-Bonus belastet nicht das dauerhafte Lohngefüge des Unternehmens und ist daher bei Personalabteilungen sehr beliebt.";
      break;
    }
  }

  return { subject, body, tacticalAdvice };
}
