// -----------------------------------------------------------------------------
// E-Mail Auto-Sync & Smart Inbox Processing Engine
// -----------------------------------------------------------------------------
// Verarbeitet eingehende E-Mails, matched diese mit bestehenden Bewerbungen,
// erkennt Statusübergänge und Termine und bereitet 1-Klick-Updates vor.
// -----------------------------------------------------------------------------
import { parseEmailResponse, ParsedEmailResponse } from "./emailResponseParser";
import { ApplicationListItem } from "@/types";

export interface SyncEmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  fullBody: string;
}

export interface MatchedEmailAction {
  email: SyncEmailMessage;
  application: ApplicationListItem;
  parsed: ParsedEmailResponse;
  suggestedStatus: string | null;
  statusChanged: boolean;
  confidenceScore: number; // 0 - 100
}

export interface EmailSyncRunResult {
  totalEmailsScanned: number;
  matchedActions: MatchedEmailAction[];
  unmatchedEmails: SyncEmailMessage[];
  syncedAt: string;
}

/**
 * Heuristik für das Matching zwischen E-Mail und vorhandenen Bewerbungen
 */
export function matchEmailToApplication(
  email: SyncEmailMessage,
  applications: ApplicationListItem[]
): { application: ApplicationListItem; confidence: number } | null {
  const fromLower = email.from.toLowerCase();
  const subjectLower = email.subject.toLowerCase();
  const bodyLower = email.fullBody.toLowerCase();

  let bestMatch: ApplicationListItem | null = null;
  let highestScore = 0;

  for (const app of applications) {
    let score = 0;
    const companyName = app.company.name.toLowerCase();
    const position = app.position.toLowerCase();

    // 1. Treffer beim Firmennamen
    if (fromLower.includes(companyName) || email.from.includes(app.company.contactEmail || "xyz@dummy.de")) {
      score += 60;
    } else if (subjectLower.includes(companyName)) {
      score += 45;
    } else if (bodyLower.includes(companyName)) {
      score += 25;
    }

    // 2. Treffer bei Position / Stellentitel
    if (subjectLower.includes(position)) {
      score += 30;
    } else if (bodyLower.includes(position)) {
      score += 15;
    }

    // 3. Wenn Bewerbungswörter im Betreff sind
    if (subjectLower.includes("bewerbung") || subjectLower.includes("application") || subjectLower.includes("vorstellungsgespräch")) {
      score += 10;
    }

    if (score > highestScore && score >= 40) {
      highestScore = score;
      bestMatch = app;
    }
  }

  if (bestMatch) {
    return { application: bestMatch, confidence: Math.min(100, highestScore) };
  }

  return null;
}

/**
 * Führt die Analyse für eine Liste von E-Mails aus
 */
export function processSyncedEmails(
  emails: SyncEmailMessage[],
  applications: ApplicationListItem[]
): EmailSyncRunResult {
  const matchedActions: MatchedEmailAction[] = [];
  const unmatchedEmails: SyncEmailMessage[] = [];

  for (const email of emails) {
    const match = matchEmailToApplication(email, applications);
    if (match) {
      const parsed = parseEmailResponse(email.fullBody);
      let suggestedStatus: string | null = null;

      if (parsed.detectedStatus === "INTERVIEW") suggestedStatus = "INTERVIEW";
      else if (parsed.detectedStatus === "REJECTED") suggestedStatus = "REJECTED";
      else if (parsed.detectedStatus === "OFFER") suggestedStatus = "OFFER";
      else if (parsed.detectedStatus === "CONFIRMATION" && match.application.status === "DRAFT") suggestedStatus = "SENT";

      const statusChanged = Boolean(suggestedStatus && suggestedStatus !== match.application.status);

      matchedActions.push({
        email,
        application: match.application,
        parsed,
        suggestedStatus,
        statusChanged,
        confidenceScore: match.confidence,
      });
    } else {
      unmatchedEmails.push(email);
    }
  }

  return {
    totalEmailsScanned: emails.length,
    matchedActions,
    unmatchedEmails,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Erzeugt realistische Test-E-Mails für die Demonstration / Offline-Nutzung
 */
export function generateSampleInboxEmails(applications: ApplicationListItem[]): SyncEmailMessage[] {
  const firstApp = applications[0];
  const secondApp = applications[1];

  const now = new Date();

  return [
    {
      id: "msg-1",
      from: firstApp ? `recruiting@${firstApp.company.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.de` : "recruiting@adesso.de",
      subject: `Einladung zum Vorstellungsgespräch: ${firstApp?.position || "Fachinformatiker Anwendungsentwicklung"}`,
      date: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
      snippet: "Sehr geehrter Herr Schepp, wir haben Ihre Bewerbungsunterlagen geprüft und möchten Sie gerne...",
      fullBody: `Sehr geehrter Herr Schepp,

wir haben Ihre Bewerbung als ${firstApp?.position || "Frontend Entwickler"} mit großem Interesse gelesen und möchten Sie gerne zu einem ersten persönlichen Online-Gespräch via Microsoft Teams einladen.

Terminvorschlag: Nächste Woche Dienstag um 14:00 Uhr.
Teams-Meeting Link: https://teams.microsoft.com/l/meetup-join/19%3ameeting_mock_link

Bitte geben Sie uns kurz Bescheid, ob Ihnen der Termin passt.

Herzliche Grüße
Ihr Recruiting-Team von ${firstApp?.company.name || "adesso SE"}`,
    },
    {
      id: "msg-2",
      from: secondApp ? `karriere@${secondApp.company.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.de` : "jobs@telekom.de",
      subject: `Eingangsbestätigung Ihrer Bewerbung als ${secondApp?.position || "Web-Entwickler"}`,
      date: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      snippet: "Guten Tag Herr Schepp, vielen Dank für Ihre Bewerbung. Ihre Unterlagen sind bei uns eingegangen...",
      fullBody: `Guten Tag Herr Schepp,

vielen Dank für Ihre Bewerbung bei ${secondApp?.company.name || "Deutsche Telekom IT"}. Ihre Unterlagen sind erfolgreich bei uns eingegangen und werden derzeit von unserem Fachbereich geprüft.

Wir melden uns schnellstmöglich bei Ihnen.

Mit freundlichen Grüßen
Personalabteilung`,
    },
  ];
}
