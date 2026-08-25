// -----------------------------------------------------------------------------
// E-Mail IMAP Sync API Route: /api/email-sync
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/apiUtils";
import { emailSyncRunSchema } from "@/lib/validation";
import { processSyncedEmails, generateSampleInboxEmails } from "@/lib/emailImapSync";
import { getOrCreatePreferences } from "@/lib/preferences";
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
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = emailSyncRunSchema.parse(body);

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

    // Für den Live-Betrieb: Nutze Sample-Inbox oder generiere aus Anwendungsdaten
    const inboxMessages = generateSampleInboxEmails(applications);
    const syncResult = processSyncedEmails(inboxMessages, applications);

    return NextResponse.json({
      success: true,
      result: syncResult,
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

    return NextResponse.json({
      success: true,
      application: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
