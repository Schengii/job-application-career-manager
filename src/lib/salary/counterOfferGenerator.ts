// -----------------------------------------------------------------------------
// KI-Verhandlungs- & Gegenangebots-Assistent (Gehalt & Benefits)
// -----------------------------------------------------------------------------
// Berechnet Verhandlungsspielräume und generiert professionelle
// Antwort- und Gegenangebots-Schreiben für erhaltene Arbeitsverträge:
// - Nachverhandlung Grundgehalt (+5% bis +15%)
// - Alternative Hebel: Mehr Urlaubstage, Weiterbildungsbudget, Homeoffice, Mobilität
// -----------------------------------------------------------------------------

export interface CounterOfferInput {
  offeredSalary: number; // in EUR
  targetSalary: number; // in EUR
  offeredVacationDays?: number; // Standard 28-30
  offeredRemoteDays?: number; // z.B. 2 Tage
  companyName: string;
  position: string;
  contactPerson?: string;
  strongestSkills?: string[]; // z.B. ["React 19", "TypeScript", "Next.js"]
}

export interface CounterOfferStrategy {
  differenceAmount: number;
  differencePercent: number;
  isAcceptableDirectly: boolean;
  recommendedCounterAmount: number;
  negotiationLevers: {
    title: string;
    description: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
  }[];
  letterDraft: string;
}

export function generateCounterOfferStrategy(input: CounterOfferInput): CounterOfferStrategy {
  const diff = input.targetSalary - input.offeredSalary;
  const diffPct = input.offeredSalary > 0 ? Math.round((diff / input.offeredSalary) * 100) : 0;
  const isAcceptable = diff <= 0;

  // Empfohlenes Gegenangebot: meist die goldene Mitte oder Zielgehalt
  const recommendedCounterAmount = isAcceptable
    ? input.offeredSalary
    : Math.round(input.offeredSalary + diff * 0.8);

  const levers = [
    {
      title: "Gehaltsüberprüfung nach der Probezeit",
      description: "Vereinbare eine feste Steigerung (z.B. +3.000 €) nach erfolgreichen 6 Monaten Probezeit im Vertrag.",
      impact: "HIGH" as const,
    },
    {
      title: "Zusätzliche Remote-Tage",
      description: `${input.offeredRemoteDays ? `${input.offeredRemoteDays + 1} Tage` : "1–2 zusätzliche Tage"} Homeoffice pro Woche sparen Fahrtkosten und erhöhen die Lebensqualität.`,
      impact: "HIGH" as const,
    },
    {
      title: "Festes Weiterbildungsbudget",
      description: "Ein jährliches Budget von 1.500–2.500 € für Konferenzen, Zertifizierungen (AWS, Scrum) oder Fachkurse.",
      impact: "MEDIUM" as const,
    },
    {
      title: "Zusätzliche Urlaubstage",
      description: "Erweiterung von 28 auf 30 Tage Jahresurlaub als nicht-monetärer Ausgleich.",
      impact: "MEDIUM" as const,
    },
  ];

  const salutation = input.contactPerson ? `Sehr geehrte(r) Frau/Herr ${input.contactPerson}` : "Sehr geehrte Damen und Herren";
  const skillsText = input.strongestSkills && input.strongestSkills.length > 0
    ? `meine fundierte Expertise in ${input.strongestSkills.join(", ")}`
    : "meine praktischen Erfahrungen in moderner Frontend-Entwicklung";

  const letterDraft = `${salutation},

vielen Dank für das Vertrauen und das vorliegende Angebot für die Position als ${input.position} bei ${input.companyName}. Die Gespräche mit Ihrem Team haben meinen positiven Eindruck bestärkt, und ich freue mich sehr über die Perspektive, gemeinsam innovative Lösungen zu realisieren.

Um das Angebot für beide Seiten optimal abzurunden, möchte ich die Vergütung noch einmal ansprechen. Unter Berücksichtigung des aktuellen Marktwertes für ${input.position} sowie des Mehrwerts, den ich durch ${skillsText} von Tag eins an einbringen werde, hatte ich ein Jahreseinkommen von ${input.targetSalary.toLocaleString("de-DE")} € angestrebt.

Ich schlage daher vor, das Grundgehalt auf ${recommendedCounterAmount.toLocaleString("de-DE")} € festzulegen – alternativ wäre für mich auch ein Einstieg zu ${input.offeredSalary.toLocaleString("de-DE")} € mit einer fest vereinbarten Anpassung nach der Probezeit oder einem erhöhten Weiterbildungsbudget von 2.000 € denkbar.

Ich bin überzeugt, dass wir eine für beide Seiten ideale Lösung finden, und freue mich auf Ihre kurze Rückmeldung.

Mit freundlichen Grüßen`;

  return {
    differenceAmount: diff,
    differencePercent: diffPct,
    isAcceptableDirectly: isAcceptable,
    recommendedCounterAmount,
    negotiationLevers: levers,
    letterDraft,
  };
}
