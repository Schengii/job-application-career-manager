import { describe, expect, it } from "vitest";
import { generateIcsContent } from "./ical";

describe("generateIcsContent", () => {
  it("erzeugt standardkonforme .ics Kalender-Daten für Vorstellungsgespräche", () => {
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
});
