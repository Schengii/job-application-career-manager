// -----------------------------------------------------------------------------
// iCal / .ics Kalenderexport für Vorstellungsgespräche & Termine
// -----------------------------------------------------------------------------
// Erzeugt eine RFC 5545-konforme iCalendar-Datei (.ics), die in alle gängigen
// Kalender (Google Kalender, Apple Kalender, Microsoft Outlook etc.) importiert
// oder per Klick direkt geöffnet werden kann.
// -----------------------------------------------------------------------------

export type IcsEventParams = {
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: Date;
  durationMinutes?: number;
  url?: string | null;
};

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function generateIcsContent({
  title,
  description,
  location,
  startDate,
  durationMinutes = 60,
  url,
}: IcsEventParams): string {
  const now = new Date();
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const uid = `interview-${startDate.getTime()}-${Math.random().toString(36).slice(2, 9)}@career-manager`;

  const escapeIcs = (str: string) =>
    str
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Job Career Manager//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${escapeIcs(title)}`,
    description ? `DESCRIPTION:${escapeIcs(description)}` : null,
    location ? `LOCATION:${escapeIcs(location)}` : null,
    url ? `URL:${url}` : null,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function generateIcsFeed(
  calendarName: string,
  events: IcsEventParams[]
): string {
  const now = new Date();

  const escapeIcs = (str: string) =>
    str
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");

  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Job Career Manager//DE",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const vevents = events.map((event, idx) => {
    const duration = event.durationMinutes || 60;
    const endDate = new Date(event.startDate.getTime() + duration * 60 * 1000);
    const uid = `event-${event.startDate.getTime()}-${idx}@career-manager`;

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(event.startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : null,
      event.location ? `LOCATION:${escapeIcs(event.location)}` : null,
      event.url ? `URL:${event.url}` : null,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ]
      .filter(Boolean)
      .join("\r\n");
  });

  const footer = ["END:VCALENDAR"];

  return [...header, ...vevents, ...footer].join("\r\n");
}

export function downloadIcsFile(filename: string, content: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
