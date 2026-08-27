// -----------------------------------------------------------------------------
// Echter IMAP-Client für den E-Mail-Auto-Sync (`/api/email-sync`, s.a.
// src/lib/emailImapSync.ts). Folgt derselben defensiven Konvention wie
// src/lib/aiService.ts: JEDER Fehler (fehlende Konfiguration, Verbindungs-,
// Auth- oder Timeout-Fehler) führt zu einem stillen Fallback auf die
// bestehende Sample-Inbox-Simulation (`generateSampleInboxEmails()`) statt zu
// einem Hard-Fail — der Nutzer bekommt die App nie "kaputt", auch mit
// falschen/fehlenden IMAP-Zugangsdaten.
// -----------------------------------------------------------------------------
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { generateSampleInboxEmails, type SyncEmailMessage } from "./emailImapSync";
import type { ApplicationListItem } from "@/types";

// Verbindungs-/Login-Timeout für den IMAP-Client — ohne dieses Limit könnte
// eine nicht erreichbare oder extrem langsam antwortende Gegenstelle die
// gesamte POST /api/email-sync-Anfrage unbegrenzt blockieren.
const CONNECTION_TIMEOUT_MS = 15_000;
// Wie weit rückwirkend nach neuen E-Mails gesucht wird, falls keine explizite
// Angabe gemacht wird.
const DEFAULT_SINCE_DAYS = 14;
// Obergrenze der pro Sync verarbeiteten Nachrichten — schützt vor einer sehr
// vollen Inbox, die den Request unnötig in die Länge zieht (weitere E-Mails
// werden schlicht beim nächsten Sync erfasst, es geht nichts verloren).
const MAX_MESSAGES = 50;

export interface ImapCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
  folder: string;
  sinceDays?: number;
}

/** Prüft, ob genügend Angaben für eine echte IMAP-Verbindung vorhanden sind. */
export function hasImapCredentials(preferences: {
  imapEnabled: boolean;
  imapHost: string | null;
  imapUser: string | null;
  imapPassword: string | null;
}): boolean {
  return Boolean(
    preferences.imapEnabled && preferences.imapHost?.trim() && preferences.imapUser?.trim() && preferences.imapPassword?.trim()
  );
}

/**
 * Baut aus einer rohen IMAP-Nachricht das `SyncEmailMessage`-Format, das
 * `processSyncedEmails()` in src/lib/emailImapSync.ts erwartet.
 */
async function toSyncEmailMessage(uid: number, source: Buffer): Promise<SyncEmailMessage> {
  const parsed = await simpleParser(source);
  const bodyText = parsed.text || (typeof parsed.html === "string" ? parsed.html : "") || "";
  return {
    id: String(uid),
    from: parsed.from?.text ?? "unbekannt",
    subject: parsed.subject ?? "(kein Betreff)",
    date: (parsed.date ?? new Date()).toISOString(),
    snippet: bodyText.slice(0, 200),
    fullBody: bodyText,
  };
}

/**
 * Verbindet sich per IMAP/TLS mit dem konfigurierten Postfach und liest neue
 * Nachrichten seit `sinceDays` aus dem konfigurierten Ordner. Gibt bei JEDEM
 * Fehler `null` zurück (nie werfend) — der Aufrufer fällt dann auf die
 * Sample-Inbox zurück, siehe `fetchInboxMessages()` unten.
 */
async function fetchRawImapMessages(credentials: ImapCredentials): Promise<SyncEmailMessage[] | null> {
  const client = new ImapFlow({
    host: credentials.host,
    port: credentials.port,
    secure: true,
    auth: { user: credentials.user, pass: credentials.password },
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: CONNECTION_TIMEOUT_MS,
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock(credentials.folder || "INBOX");
    try {
      const since = new Date(Date.now() - (credentials.sinceDays ?? DEFAULT_SINCE_DAYS) * 24 * 60 * 60 * 1000);
      const messages: SyncEmailMessage[] = [];

      for await (const message of client.fetch({ since }, { uid: true, source: true })) {
        if (!message.source) continue;
        messages.push(await toSyncEmailMessage(message.uid, message.source));
        if (messages.length >= MAX_MESSAGES) break;
      }

      return messages;
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error("imapClient: IMAP-Verbindung oder Abruf fehlgeschlagen, falle auf Sample-Inbox zurück.", error);
    return null;
  } finally {
    await client.logout().catch(() => {
      // Verbindung war ggf. nie erfolgreich aufgebaut (siehe catch oben) —
      // ein fehlschlagendes logout() ist in diesem Fall irrelevant.
    });
  }
}

export interface InboxFetchResult {
  messages: SyncEmailMessage[];
  usedRealImap: boolean;
}

/**
 * Öffentlicher Einstiegspunkt für `/api/email-sync`: liefert IMMER ein
 * Ergebnis, nie einen Fehler. Nutzt eine echte IMAP-Verbindung, sobald
 * genügend Zugangsdaten vorhanden sind, sonst (oder bei einem Verbindungs-
 * fehler) die bestehende Sample-Inbox-Simulation aus emailImapSync.ts.
 */
export async function fetchInboxMessages(
  preferences: {
    imapEnabled: boolean;
    imapHost: string | null;
    imapPort: number | null;
    imapUser: string | null;
    imapPassword: string | null;
    imapFolder: string | null;
  },
  applications: ApplicationListItem[]
): Promise<InboxFetchResult> {
  if (!hasImapCredentials(preferences)) {
    return { messages: generateSampleInboxEmails(applications), usedRealImap: false };
  }

  const messages = await fetchRawImapMessages({
    host: preferences.imapHost!.trim(),
    port: preferences.imapPort ?? 993,
    user: preferences.imapUser!.trim(),
    password: preferences.imapPassword!,
    folder: preferences.imapFolder?.trim() || "INBOX",
  });

  if (messages === null) {
    return { messages: generateSampleInboxEmails(applications), usedRealImap: false };
  }

  return { messages, usedRealImap: true };
}
