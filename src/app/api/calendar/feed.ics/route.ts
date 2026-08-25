// -----------------------------------------------------------------------------
// Live iCal-Feed Route: /api/calendar/feed.ics
// -----------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateIcsFeed, type IcsEventParams } from "@/lib/ical";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      include: {
        company: true,
      },
      orderBy: {
        applicationDate: "desc",
      },
    });

    const events: IcsEventParams[] = [];

    for (const app of applications) {
      // 1. Vorstellungsgespräche & Termine
      if (app.nextStepDate) {
        const date = new Date(app.nextStepDate);
        if (!isNaN(date.getTime())) {
          const isInterview = app.status === "INTERVIEW";
          const locationStr = app.meetingUrl
            ? app.meetingUrl
            : app.company.city || "Online / Vor Ort";

          events.push({
            title: isInterview
              ? `🎯 Gespräch: ${app.position} (${app.company.name})`
              : `📌 ${app.nextStep || "Frist/Wiedervorlage"}: ${app.company.name}`,
            description: `Bewerbung: ${app.position} bei ${app.company.name}\nStatus: ${app.status}\nAnsprechpartner: ${
              app.company.contactName || "—"
            }\nE-Mail: ${app.company.contactEmail || "—"}${
              app.meetingUrl ? `\nMeeting-Link: ${app.meetingUrl}` : ""
            }\nNotizen: ${app.notes || "—"}`,
            location: locationStr,
            url: app.meetingUrl || undefined,
            startDate: date,
            durationMinutes: isInterview ? 60 : 30,
          });
        }
      }
    }

    const icsContent = generateIcsFeed("Job Application & Career Manager", events);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="bewerbungen-kalender.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Fehler beim Generieren des Kalender-Feeds:", error);
    return new NextResponse("Fehler beim Generieren des Kalender-Feeds", { status: 500 });
  }
}
