// -----------------------------------------------------------------------------
// KI-Gehaltsverhandlungs-Coach & Roleplay Simulator Engine
// -----------------------------------------------------------------------------
// Simuliert realistische Verhandlungsgespräche zwischen Bewerber und Arbeitgeber,
// bewertet Verhandlungstaktiken (BATNA, Value Framing, Kompromisse) und liefert
// dynamische Gegenangebote sowie detailliertes taktisches Feedback.
// -----------------------------------------------------------------------------

export type NegotiationPersona = "HR_MANAGER" | "TECH_LEAD" | "EXECUTIVE";

export type NegotiationScenarioId =
  | "INITIAL_OFFER_BELOW_TARGET"
  | "COUNTER_OFFER_BATNA"
  | "BENEFITS_TRADE_OFF"
  | "PERFORMANCE_RAISE";

export interface NegotiationScenario {
  id: NegotiationScenarioId;
  title: string;
  description: string;
  initialOffer: number;
  targetSalary: number;
  initialMessage: string;
  persona: NegotiationPersona;
  personaName: string;
  personaTitle: string;
  focusLevers: string[];
}

export interface NegotiationMessage {
  id: string;
  sender: "USER" | "AI";
  text: string;
  timestamp: string;
  tacticalTip?: string;
  currentOfferAmount?: number;
}

export interface NegotiationEvaluation {
  overallScore: number; // 0 - 100
  rating: "EXZELLENT" | "STARK" | "AUSBAUFÄHIG" | "UNSICHER";
  finalOffer: number;
  deltaToTarget: number;
  strengths: string[];
  improvements: string[];
  tacticsUsed: {
    valueFraming: boolean;
    batnaMentioned: boolean;
    nonMonetaryCompromise: boolean;
    marketDataCited: boolean;
  };
  summary: string;
}

export const SCENARIOS: NegotiationScenario[] = [
  {
    id: "INITIAL_OFFER_BELOW_TARGET",
    title: "Einstiegsangebot unter Gehaltswunsch",
    description: "Das Unternehmen bietet 43.000 €, dein Zielgehalt liegt bei 48.000 € – 50.000 €.",
    initialOffer: 43000,
    targetSalary: 48000,
    persona: "HR_MANAGER",
    personaName: "Frau Sabine Schneider",
    personaTitle: "Head of People & Culture",
    initialMessage:
      "Guten Tag Herr Schepp, wir haben uns im Team beraten und möchten Ihnen sehr gerne ein Angebot als Frontend Entwickler unterbreiten. Wir können Ihnen ein Einstiegsgehalt von 43.000 € brutto im Jahr anbieten. Wie klingt das für Sie?",
    focusLevers: ["Praxisprojekte (electroCheck-ai)", "Marktwert Fachinformatiker AE", "Next.js & TypeScript Stack"],
  },
  {
    id: "COUNTER_OFFER_BATNA",
    title: "Verhandlung mit vorliegendem Gegenangebot (BATNA)",
    description: "Du hast ein konkurrierendes Angebot über 51.000 € und möchtest deine Traumfirma nachziehen lassen.",
    initialOffer: 46000,
    targetSalary: 51000,
    persona: "TECH_LEAD",
    personaName: "Markus Becker",
    personaTitle: "Engineering Manager / Lead Architect",
    initialMessage:
      "Hallo Herr Schepp, das Fachgespräch war spitze. Wir haben intern ein Budget von 46.000 € für die Stelle allokiert. Passt das für Ihren Einstieg bei uns?",
    focusLevers: ["Konkurrenzangebot professionell erwähnen", "Präferenz für das Team betonen", "Sofortige Produktivität"],
  },
  {
    id: "BENEFITS_TRADE_OFF",
    title: "Gehaltsbudget fix – Benefits & Sachbezüge verhandeln",
    description: "Das Grundgehalt ist starr auf 45.000 € gedeckelt. Hole 4 Tage Home-Office, Weiterbildung und Jobticket heraus.",
    initialOffer: 45000,
    targetSalary: 45000,
    persona: "EXECUTIVE",
    personaName: "Dr. Thomas Weber",
    personaTitle: "Geschäftsführer / CTO",
    initialMessage:
      "Herr Schepp, durch unsere Tarif- und Gehaltsbänder können wir beim reinen Festgehalt maximal 45.000 € darstellen. Gibt es andere Rahmenbedingungen, über die wir sprechen können?",
    focusLevers: ["3-4 Tage Home-Office", "1.500 € Weiterbildungsbudget", "Deutschlandticket / Fahrtkostenzuschuss"],
  },
];

/**
 * Antwort-Generator für den Verhandlungs-Coach (funktioniert 100% offline & deterministisch)
 */
export function generateNegotiationStep(
  scenario: NegotiationScenario,
  history: NegotiationMessage[],
  userResponse: string
): { reply: string; newOffer: number; tacticalTip: string } {
  const text = userResponse.toLowerCase();
  const stepIndex = Math.floor(history.length / 2);

  // Analyse der User-Antwort
  const hasValueFraming =
    text.includes("react") ||
    text.includes("typescript") ||
    text.includes("next.js") ||
    text.includes("erfahrung") ||
    text.includes("projekt") ||
    text.includes("electrocheck") ||
    text.includes("qualität") ||
    text.includes("einarbeitung");

  const hasCompromise =
    text.includes("home-office") ||
    text.includes("homeoffice") ||
    text.includes("weiterbildung") ||
    text.includes("ticket") ||
    text.includes("urlaub") ||
    text.includes("bonus") ||
    text.includes("schulung") ||
    text.includes("zertifikat");

  const hasBatna =
    text.includes("anderes angebot") ||
    text.includes("vorliegen") ||
    text.includes("markt") ||
    text.includes("vergleich") ||
    text.includes("optionen");

  // Aktuelles Angebot ermitteln
  const lastOffer =
    history.filter((m) => m.sender === "AI" && m.currentOfferAmount).slice(-1)[0]?.currentOfferAmount ||
    scenario.initialOffer;

  let newOffer = lastOffer;
  let reply = "";
  let tacticalTip = "";

  if (stepIndex === 0) {
    if (hasValueFraming || hasBatna) {
      newOffer = Math.min(scenario.targetSalary, lastOffer + 2500);
      reply =
        `Ich verstehe Ihre Argumentation bezüglich Ihrer fundierten Kenntnisse in modernen Webtechnologien und Praxisprojekten. Wenn wir uns die Einarbeitungszeit anschauen, können wir Ihnen entgegenkommen und das Angebot auf ${newOffer.toLocaleString("de-DE")} € anheben. Würde Ihnen das den Einstieg erleichtern?`;
      tacticalTip = "Guter Einstieg! Du hast deinen Mehrwert argumentiert. Jetzt kannst du bei Bedarf noch Benefits (z.B. Home-Office) ergänzen.";
    } else {
      newOffer = Math.min(scenario.targetSalary, lastOffer + 1000);
      reply =
        `Vielen Dank für Ihre Offenheit. Wir sind an unser Budget gebunden, könnten aber auf ${newOffer.toLocaleString("de-DE")} € nachbessern. Welche konkreten Punkte sind Ihnen neben dem Grundgehalt noch wichtig?`;
      tacticalTip = "Tipp: Begründe deinen Gehaltssprung immer mit messbarem Nutzen für das Unternehmen (z.B. direkte Entlastung im Frontend, Clean Code).";
    }
  } else if (stepIndex === 1) {
    if (hasCompromise) {
      newOffer = Math.min(scenario.targetSalary, lastOffer + 1500);
      reply =
        `Das klingt nach einem sehr fairen Kompromiss. Wir können zusätzlich zu den ${newOffer.toLocaleString("de-DE")} € fest 3 Tage Home-Office pro Woche sowie ein jährliches Weiterbildungsbudget von 1.200 € im Vertrag fixieren. Damit hätten wir ein rundes Gesamtpaket!`;
      tacticalTip = "Hervorragend! Die Kombination aus moderatem Gehaltsplus und geldwerten Benefits maximiert die Total Compensation.";
    } else {
      newOffer = Math.min(scenario.targetSalary, lastOffer + 1000);
      reply =
        `Wir möchten die Zusammenarbeit unbedingt realisieren. Als finale Zahl können wir ${newOffer.toLocaleString("de-DE")} € darstellen. Wären Sie bereit, unter diesen Konditionen bei uns zu unterschreiben?`;
      tacticalTip = "Der Arbeitgeber nähert sich der Schmerzgrenze. Bringe das Gespräch nun positiv zum Abschluss.";
    }
  } else {
    newOffer = Math.max(lastOffer, scenario.targetSalary);
    reply =
      `Ausgezeichnet! Wir freuen uns sehr, dass wir uns auf ${newOffer.toLocaleString("de-DE")} € einigen konnten. Ich lasse Ihnen den fertigen Arbeitsvertrag umgehend per E-Mail zukommen. Willkommen im Team! 🎉`;
    tacticalTip = "Verhandlung erfolgreich abgeschlossen! Schließe das Gespräch immer verbindlich und bedankend ab.";
  }

  return { reply, newOffer, tacticalTip };
}

/**
 * Bewertet den gesamten Verhandlungsverlauf und generiert eine Scorecard
 */
export function evaluateNegotiationPerformance(
  scenario: NegotiationScenario,
  history: NegotiationMessage[]
): NegotiationEvaluation {
  const userMessages = history.filter((m) => m.sender === "USER").map((m) => m.text.toLowerCase()).join(" ");

  const valueFraming = userMessages.includes("react") || userMessages.includes("typescript") || userMessages.includes("projekt") || userMessages.includes("erfahrung");
  const batnaMentioned = userMessages.includes("angebot") || userMessages.includes("markt") || userMessages.includes("vergleich");
  const nonMonetaryCompromise = userMessages.includes("home-office") || userMessages.includes("weiterbildung") || userMessages.includes("ticket") || userMessages.includes("urlaub");
  const marketDataCited = userMessages.includes("fachinformatiker") || userMessages.includes("brutto") || userMessages.includes("jahr");

  let score = 50;
  if (valueFraming) score += 20;
  if (nonMonetaryCompromise) score += 15;
  if (batnaMentioned) score += 10;
  if (marketDataCited) score += 5;

  const finalAiMessage = history.filter((m) => m.sender === "AI" && m.currentOfferAmount).slice(-1)[0];
  const finalOffer = finalAiMessage?.currentOfferAmount || scenario.initialOffer;
  const deltaToTarget = finalOffer - scenario.initialOffer;

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (valueFraming) strengths.push("Starke Verankerung des eigenen Tech-Stacks (TypeScript/React) als Mehrwert.");
  else improvements.push("Betone stärker deine konkreten Praxiserfahrungen und Projekte.");

  if (nonMonetaryCompromise) strengths.push("Clevere Hebelung von Zusatzleistungen (Home-Office, Weiterbildung).");
  else improvements.push("Nutze auch steuerfreie Sachbezüge wie das Deutschlandticket für mehr Netto.");

  if (deltaToTarget > 0) strengths.push(`Erfolgreiche Nachverhandlung um +${deltaToTarget.toLocaleString("de-DE")} €.`);

  let rating: NegotiationEvaluation["rating"] = "AUSBAUFÄHIG";
  if (score >= 85) rating = "EXZELLENT";
  else if (score >= 70) rating = "STARK";
  else if (score < 60) rating = "UNSICHER";

  return {
    overallScore: Math.min(100, score),
    rating,
    finalOffer,
    deltaToTarget,
    strengths,
    improvements,
    tacticsUsed: {
      valueFraming,
      batnaMentioned,
      nonMonetaryCompromise,
      marketDataCited,
    },
    summary: `Du hast das Einstiegsangebot von ${scenario.initialOffer.toLocaleString("de-DE")} € auf ${finalOffer.toLocaleString("de-DE")} € gesteigert (+${deltaToTarget.toLocaleString("de-DE")} €). Deine Taktik war ${rating.toLowerCase()}.`,
  };
}
