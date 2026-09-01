// -----------------------------------------------------------------------------
// E-Mail IMAP Sync API Route: /api/email-sync
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { emailSyncRunSchema } from "@/lib/validation";
import { processSyncedEmails, generateSampleInboxEmails } from "@/lib/emailImapSync";
import { fetchInboxMessages } from "@/lib/imapClient";
import { getOrCreatePreferences, maskSecret } from "@/lib/preferences";
import { sendDueNotifications } from "@/lib/pushNotifications";
import type { ApplicationListItem } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const preferences = await getOrCreatePreferences();
    return NextResponse.json({
      imapEnabled: preferences.imapEnabled,
      imapHost: preferences.imapHost,
      imapPort: preferences.imapPort,
      imapUser: preferences.imapUser,
      imapFolder: preferences.imapFolder || "INBOX",
      // Secret-Feld: niemals im Klartext, nur ob eines hinterlegt ist + eine
      // Vorschau der letzten Zeichen (analog aiApiKey, siehe preferences.ts).
      hasImapPassword: Boolean(preferences.imapPassword?.trim()),
      imapPasswordPreview: maskSecret(preferences.imapPassword),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // `password` erlaubt einen Einmal-Test-Sync mit einem noch nicht
    // gespeicherten Passwort (z.B. bevor der Nutzer in den Einstellungen auf
    // "Speichern" klickt); `simulate: true` erzwingt weiterhin die
    // Sample-Inbox, auch wenn echte Zugangsdaten hinterlegt sind (nützlich,
    // um die Funktion ohne Postfachzugriff vorzuführen/zu testen).
    const parsedBody = emailSyncRunSchema.parse(body);

    const preferences = await getOrCreatePreferences();

    // Lade alle relevanten Bewerbungen
    const applications = (await prisma.application.findMany({
      include: {
        company: true,
        jobPosting: true,
        coverLetter: true,
        _count: {
          select: {
            statusEvents: true,
            documents: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })) as unknown as ApplicationListItem[];

    // Echter IMAP-Abruf, sobald genügend Zugangsdaten vorhanden sind (s.
    // src/lib/imapClient.ts) — fällt bei fehlender Konfiguration oder einem
    // Verbindungsfehler automatisch auf die Sample-Inbox zurück, nie ein
    // Hard-Fail für den Nutzer.
    const { messages: inboxMessages, usedRealImap } = parsedBody.simulate
      ? { messages: generateSampleInboxEmails(applications), usedRealImap: false }
      : await fetchInboxMessages(
          {
            imapEnabled: preferences.imapEnabled,
            imapHost: preferences.imapHost,
            imapPort: preferences.imapPort,
            imapUser: preferences.imapUser,
            // Ein im Request mitgegebenes Test-Passwort hat Vorrang vor dem
            // gespeicherten (siehe Kommentar zu `emailSyncRunSchema` oben).
            imapPassword: parsedBody.password || preferences.imapPassword,
            imapFolder: preferences.imapFolder,
          },
          applications
        );
    const syncResult = processSyncedEmails(inboxMessages, applications);

    // Persistiert alle Vorschläge mit einem konkreten Status-Vorschlag, damit
    // sie in der zentralen Antworten-Inbox (GET /api/email-sync/pending)
    // über alle Bewerbungen hinweg auftauchen, statt nur beim erneuten
    // Öffnen dieser Sync-Route sichtbar zu sein. Ein erneuter Sync derselben
    // E-Mail legt dank @@unique([applicationId, emailId]) keinen Duplikat-
    // Eintrag an (bereits angenommene/abgelehnte Vorschläge bleiben also
    // unverändert bestehen).
    for (const action of syncResult.matchedActions) {
      if (!action.suggestedStatus) continue;
      try {
        await prisma.emailSuggestion.create({
          data: {
            emailId: action.email.id,
            emailFrom: action.email.from,
            emailSubject: action.email.subject,
            emailSnippet: action.email.snippet,
            emailDate: new Date(action.email.date),
            detectedStatus: action.parsed.detectedStatus,
            suggestedStatus: action.suggestedStatus,
            statusLabel: action.parsed.statusLabel,
            reasoning: action.parsed.reasoning,
            confidence: action.confidenceScore,
            extractedDate: action.parsed.extractedDate ?? null,
            extractedTime: action.parsed.extractedTime ?? null,
            applicationId: action.application.id,
          },
        });
      } catch (error) {
        // P2002 = Vorschlag existiert bereits (identische E-Mail/Bewerbung) —
        // erwartet bei wiederholten Syncs, kein Fehlerfall.
        if (!(typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002")) {
          throw error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      result: syncResult,
      usedRealImap,
      connectedAccount: preferences.imapUser || "Demo / Offline Mode",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// 1-Klick Status-Update & Event-Logger für eine erkannte E-Mail
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, newStatus, note, meetingUrl, nextStepDate } = body;

    if (!applicationId) {
      return NextResponse.json({ error: "applicationId erforderlich" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus || application.status,
        meetingUrl: meetingUrl !== undefined ? meetingUrl : application.meetingUrl,
        nextStepDate: nextStepDate ? new Date(nextStepDate) : application.nextStepDate,
        statusEvents: newStatus && newStatus !== application.status
          ? {
              create: {
                status: newStatus,
                note: note || "Automatisch aktualisiert über E-Mail Sync",
              },
            }
          : undefined,
        interactions: {
          create: {
            type: "EMAIL",
            title: "E-Mail Eingang via Auto-Sync",
            summary: note || "E-Mail verarbeitet und zugeordnet.",
          },
        },
      },
      include: {
        company: true,
        statusEvents: true,
        interactions: true,
      },
    });

    // Fire-and-forget, siehe Kommentar in /api/applications/[id]/status/route.ts.
    void sendDueNotifications();

    return NextResponse.json({
      success: true,
      application: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
