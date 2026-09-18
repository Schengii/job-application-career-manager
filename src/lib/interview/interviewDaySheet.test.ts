import { describe, expect, it } from "vitest";
import {
  generateMapsNavigationUrl,
  buildInterviewDayData,
  DEFAULT_INTERVIEW_DAY_QUESTIONS,
} from "@/lib/interview/interviewDaySheet";

describe("interviewDaySheet", () => {
  it("erzeugt eine valide Google Maps URL für Adressen", () => {
    const url = generateMapsNavigationUrl("Musterstr. 12", "53111", "Bonn");
    expect(url).toBe("https://www.google.com/maps/search/?api=1&query=Musterstr.%2012%2C%2053111%2C%20Bonn");
  });

  it("gibt null zurück, wenn keine Adressdaten vorliegen", () => {
    const url = generateMapsNavigationUrl(null, null, null);
    expect(url).toBeNull();
  });

  it("baut Interview-Day Sheet Daten vollständig auf", () => {
    const data = buildInterviewDayData({
      id: "app-123",
      position: "Frontend Developer",
      meetingUrl: "https://meet.google.com/xyz",
      interviewStage: "TECH_INTERVIEW",
      nextStepDate: new Date().toISOString(),
      notes: "Sehr nettes Erstgespräch mit Herrn Müller gehabt.",
      company: {
        name: "Code Factory GmbH",
        street: "Kölner Str. 50",
        postalCode: "50667",
        city: "Köln",
        contactName: "Herr Müller",
        contactPhone: "+49 221 12345",
        contactEmail: "jobs@codefactory.de",
      },
      jobPosting: {
        techStack: "TypeScript, React, Tailwind, Next.js, Jest, Cypress",
      },
    });

    expect(data.companyName).toBe("Code Factory GmbH");
    expect(data.fullAddress).toBe("Kölner Str. 50, 50667 Köln");
    expect(data.mapsNavigationUrl).toContain("maps/search");
    expect(data.contactPhone).toBe("+49 221 12345");
    expect(data.meetingUrl).toBe("https://meet.google.com/xyz");
    expect(data.topTechSkills).toHaveLength(6);
    expect(data.keyQuestionsToAsk).toEqual(DEFAULT_INTERVIEW_DAY_QUESTIONS);
  });
});
