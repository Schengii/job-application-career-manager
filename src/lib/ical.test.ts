import { describe, expect, it } from "vitest";
import { generateIcsContent, generateIcsFeed } from "./ical";

describe("ical generator", () => {
  it("erzeugt standardkonforme .ics Kalender-Daten für ein einzelnes Vorstellungsgespräch", () => {
    const startDate = new Date("2026-09-15T10:00:00.000Z");
    const ics = generateIcsContent({
      title: "Vorstellungsgespräch: Frontend Entwickler (Tech Corp)",
      description: "Erstes Fachgespräch via Microsoft Teams",
      location: "Bonn / Online",
      startDate,
      durationMinutes: 45,
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Vorstellungsgespräch: Frontend Entwickler (Tech Corp)");
    expect(ics).toContain("DESCRIPTION:Erstes Fachgespräch via Microsoft Teams");
    expect(ics).toContain("LOCATION:Bonn / Online");
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("erzeugt einen abonnierbaren Kalender-Feed mit mehreren Terminen", () => {
    const events = [
      {
        title: "Interview 1",
        startDate: new Date("2026-09-20T14:00:00.000Z"),
      },
      {
        title: "Wiedervorlage 2",
        startDate: new Date("2026-09-22T09:00:00.000Z"),
      },
    ];

    const feed = generateIcsFeed("Mein Bewerbungskalender", events);
    expect(feed).toContain("X-WR-CALNAME:Mein Bewerbungskalender");
    expect(feed).toContain("SUMMARY:Interview 1");
    expect(feed).toContain("SUMMARY:Wiedervorlage 2");
    expect(feed.split("BEGIN:VEVENT").length - 1).toBe(2);
  });
});
