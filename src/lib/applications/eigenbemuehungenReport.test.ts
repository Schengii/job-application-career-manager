import { describe, it, expect } from "vitest";
import { generateEigenbemuehungenHtml, filterApplicationsByPeriod } from "@/lib/applications/eigenbemuehungenReport";
import type { ApplicationListItem } from "@/types";

describe("eigenbemuehungenReport", () => {
  const sampleApps: ApplicationListItem[] = [
    {
      id: "app-1",
      position: "Frontend Entwickler (React/Next.js)",
      status: "INTERVIEW",
      applicationDate: "2026-08-10T10:00:00Z",
      nextStep: "Technisches Fachgespräch",
      nextStepDate: "2026-08-20T14:00:00Z",
      meetingUrl: "https://meet.google.com/abc",
      rejectionReason: null,
      interviewStage: "TECH_INTERVIEW",
      timeSpentMinutes: 60,
      tags: "React,TypeScript",
      notes: null,
      source: "Stepstone",
      createdAt: "2026-08-10T10:00:00Z",
      updatedAt: "2026-08-15T10:00:00Z",
      company: {
        id: "comp-1",
        name: "Acme Tech GmbH",
        postalCode: "53111",
        city: "Bonn",
        contactName: "Frau Schmidt",
      },
      jobPosting: null,
    },
    {
      id: "app-2",
      position: "Fullstack Webentwickler",
      status: "REJECTED",
      applicationDate: "2026-08-05T09:00:00Z",
      nextStep: null,
      nextStepDate: null,
      meetingUrl: null,
      rejectionReason: "Stelle intern besetzt",
      interviewStage: null,
      timeSpentMinutes: 45,
      tags: null,
      notes: null,
      source: "Indeed",
      createdAt: "2026-08-05T09:00:00Z",
      updatedAt: "2026-08-12T09:00:00Z",
      company: {
        id: "comp-2",
        name: "WebSolutions KG",
        postalCode: "50667",
        city: "Köln",
        contactName: null,
      },
      jobPosting: null,
    },
    {
      id: "app-3",
      position: "TypeScript Entwickler",
      status: "SENT",
      applicationDate: "2026-07-01T10:00:00Z",
      nextStep: null,
      nextStepDate: null,
      meetingUrl: null,
      rejectionReason: null,
      interviewStage: null,
      timeSpentMinutes: 30,
      tags: null,
      notes: null,
      source: null,
      createdAt: "2026-07-01T10:00:00Z",
      updatedAt: "2026-07-01T10:00:00Z",
      company: {
        id: "comp-3",
        name: "DevHouse",
        postalCode: "44137",
        city: "Dortmund",
        contactName: null,
      },
      jobPosting: null,
    },
  ] as unknown as ApplicationListItem[];

  it("filtert Bewerbungen korrekt nach Datum", () => {
    const start = new Date("2026-08-01T00:00:00Z");
    const end = new Date("2026-08-31T23:59:59Z");
    const filtered = filterApplicationsByPeriod(sampleApps, start, end);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((a) => a.id)).toEqual(["app-1", "app-2"]);
  });

  it("erzeugt valides HTML mit amtlichem Kopf und Tabelle", () => {
    const html = generateEigenbemuehungenHtml({
      candidateName: "Max Mustermann",
      candidateAddress: "Musterstraße 1, 53111 Bonn",
      candidateEmail: "max@example.com",
      candidatePhone: "0170 1234567",
      customerId: "123A456789",
      periodLabel: "August 2026",
      applications: sampleApps.slice(0, 2),
    });

    expect(html).toContain("Nachweis von Eigenbemühungen");
    expect(html).toContain("§ 38 Abs. 2 / § 159 SGB III");
    expect(html).toContain("Max Mustermann");
    expect(html).toContain("123A456789");
    expect(html).toContain("Acme Tech GmbH");
    expect(html).toContain("Frontend Entwickler (React/Next.js)");
    expect(html).toContain("WebSolutions KG");
    expect(html).toContain("Bewerbungen gesamt:</strong> 2");
    expect(html).toContain("Vorstellungsgespräche:</strong> 1");
    expect(html).toContain("Absagen:</strong> 1");
    expect(html).toContain("Unterschrift Max Mustermann");
  });
});
