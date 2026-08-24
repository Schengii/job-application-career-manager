// -----------------------------------------------------------------------------
// E-Mail-Rückmeldungs-Parser (Response Analyzer)
// -----------------------------------------------------------------------------
// Analysiert Arbeitgeber-E-Mails und erkennt automatisch den Status
// (Einladung, Absage, Eingangsbestätigung, Angebot) sowie vorgeschlagene Termine.
// -----------------------------------------------------------------------------

export type DetectedEmailStatus = "INTERVIEW" | "OFFER" | "REJECTED" | "CONFIRMATION" | "UNKNOWN";

export type ParsedEmailResponse = {
  detectedStatus: DetectedEmailStatus;
  statusLabel: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  suggestedAction: string;
  extractedDate?: string; // ISO string oder deutsches Datum
  extractedTime?: string;
  matchingCompanyHint?: string;
  reasoning: string;
};

export function parseEmailResponse(emailText: string): ParsedEmailResponse {
  const text = emailText.toLowerCase();

  // 1. Absage-Muster
  const rejectPatterns = [
    "leider mitteilen",
    "leider müssen wir",
    "nicht berücksichtigen",
    "anderweitig entschieden",
    "mit bedauern",
    "keine positive nachricht",
    "absage",
    "nicht geklappt",
    "viel erfolg für ihren weiteren",
  ];
  if (rejectPatterns.some((p) => text.includes(p))) {
    return {
      detectedStatus: "REJECTED",
      statusLabel: "Absage",
      confidence: "HIGH",
      suggestedAction: "Status auf 'Absage' setzen",
      reasoning: "E-Mail enthält typische Absage-Formulierungen.",
    };
  }

  // 2. Vertragsangebot-Muster
  const offerPatterns = [
    "vertragsangebot",
    "arbeitsvertrag",
    "freuen uns, ihnen ein angebot",
    "angebot unterbreiten",
    "willkommen im team",
    "zusage",
  ];
  if (offerPatterns.some((p) => text.includes(p))) {
    return {
      detectedStatus: "OFFER",
      statusLabel: "Vertragsangebot / Zusage",
      confidence: "HIGH",
      suggestedAction: "Status auf 'Angebot' setzen & Gehaltsrechner öffnen",
      reasoning: "E-Mail signalisiert ein konkretes Angebot oder eine Zusage.",
    };
  }

  // 3. Interview- / Einladungs-Muster
  const interviewPatterns = [
    "einladung zum",
    "kennenlerngespräch",
    "vorstellungsgespräch",
    "telefoninterview",
    "videointerview",
    "teams-meeting",
    "zoom-meeting",
    "persönlich kennenlernen",
    "termin vorschlagen",
    "zeit für ein kurzes gespräch",
    "technisches interview",
  ];
  if (interviewPatterns.some((p) => text.includes(p))) {
    // Versuche Datum & Uhrzeit zu extrahieren
    const dateMatch = emailText.match(/\b(\d{1,2}\.\d{1,2}\.(?:\d{4}|\d{2}))\b/);
    const timeMatch = emailText.match(/\b(\d{1,2}:\d{2}(?:\s*uhr)?)\b/i);

    return {
      detectedStatus: "INTERVIEW",
      statusLabel: "Einladung zum Vorstellungsgespräch",
      confidence: "HIGH",
      suggestedAction: "Status auf 'Gespräch' setzen & Termin im Kalender vormerken",
      extractedDate: dateMatch ? dateMatch[1] : undefined,
      extractedTime: timeMatch ? timeMatch[1] : undefined,
      reasoning: "E-Mail enthält eine Einladung zu einem Gespräch / Video-Interview.",
    };
  }

  // 4. Eingangsbestätigungs-Muster
  const confirmationPatterns = [
    "bewerbung erhalten",
    "eingangsbestätigung",
    "vielen dank für ihre bewerbung",
    "unterlagen sind eingegangen",
    "sorgfältig prüfen",
    "etwas zeit in anspruch nehmen",
  ];
  if (confirmationPatterns.some((p) => text.includes(p))) {
    return {
      detectedStatus: "CONFIRMATION",
      statusLabel: "Eingangsbestätigung",
      confidence: "MEDIUM",
      suggestedAction: "Status auf 'Eingereicht' belassen & Notiz ergänzen",
      reasoning: "E-Mail bestätigt den erfolgreichen Erhalt der Unterlagen.",
    };
  }

  return {
    detectedStatus: "UNKNOWN",
    statusLabel: "Unbekannt / Allgemeine Rückfrage",
    confidence: "LOW",
    suggestedAction: "Status manuell prüfen",
    reasoning: "Kein eindeutiges Muster für Zusage, Absage oder Einladung gefunden.",
  };
}
