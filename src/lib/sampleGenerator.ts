// -----------------------------------------------------------------------------
// Automatischer Bewerbungs-Generator (Sample / Batch Generator)
// -----------------------------------------------------------------------------
// Erstellt auf Knopfdruck realistische Bewerbungsdatensätze für unterschiedliche
// Phasen (Gesendet, Gespräch, Zusage, Absage) über die letzten 6 Monate,
// um Statistiken, Trichter und Metriken sofort zu füllen und zu testen.
// -----------------------------------------------------------------------------
import { prisma } from "@/lib/prisma";

export const SAMPLE_COMPANIES = [
  {
    name: "Adesso SE",
    city: "Dortmund",
    contactName: "Frau Julia Becker",
    contactEmail: "karriere@adesso.de",
    website: "https://www.adesso.de",
    portal: "GetInIT",
    position: "Frontend Entwickler (React / TypeScript)",
    status: "INTERVIEW",
    monthsAgo: 1,
    nextStep: "Technisches Fachgespräch (Coding Challenge)",
    daysUntilNext: 3,
  },
  {
    name: "Materna Information & Communications SE",
    city: "Dortmund",
    contactName: "Herr Michael Schmidt",
    contactEmail: "jobs@materna.de",
    website: "https://www.materna.de",
    portal: "Stepstone",
    position: "Junior Web Developer (Next.js)",
    status: "OFFER",
    monthsAgo: 2,
    nextStep: "Vertragsangebot prüfen",
    daysUntilNext: null,
  },
  {
    name: "Deutsche Telekom IT GmbH",
    city: "Bonn",
    contactName: "Frau Laura Wagner",
    contactEmail: "recruiting@telekom.de",
    website: "https://www.telekom.com",
    portal: "Stepstone",
    position: "Softwareentwickler Frontend (m/w/d)",
    status: "SENT",
    monthsAgo: 0.5,
    nextStep: "Rückmeldung auf Bewerbung abwarten",
    daysUntilNext: 7,
  },
  {
    name: "BWI GmbH",
    city: "Bonn",
    contactName: "Herr Thomas Weber",
    contactEmail: "karriere@bwi.de",
    website: "https://www.bwi.de",
    portal: "Arbeitsagentur",
    position: "Fachinformatiker Anwendungsentwicklung (Frontend)",
    status: "REJECTED",
    monthsAgo: 3,
    nextStep: "Absage archiviert",
    daysUntilNext: null,
  },
  {
    name: "Trivago N.V.",
    city: "Düsseldorf",
    contactName: "Sarah Jenkins",
    contactEmail: "talent@trivago.com",
    website: "https://www.trivago.com",
    portal: "LinkedIn",
    position: "Frontend Engineer (UI/UX, TypeScript)",
    status: "INTERVIEW",
    monthsAgo: 1.5,
    nextStep: "Zweites Interview mit dem Team",
    daysUntilNext: 5,
  },
  {
    name: "Check24 Vergleichsportal",
    city: "Köln",
    contactName: "Herr David Klein",
    contactEmail: "jobs@check24.de",
    website: "https://www.check24.de",
    portal: "Indeed",
    position: "React Developer (Full Remote möglich)",
    status: "SENT",
    monthsAgo: 0.2,
    nextStep: "Eingangsbestätigung erhalten",
    daysUntilNext: 10,
  },
];

export async function generateSampleApplications(count = 6) {
  const selected = SAMPLE_COMPANIES.slice(0, count);
  const createdList = [];

  for (const sample of selected) {
    // 1. Firma erstellen oder finden
    let company = await prisma.company.findFirst({
      where: { name: sample.name },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: sample.name,
          city: sample.city,
          contactName: sample.contactName,
          contactEmail: sample.contactEmail,
          website: sample.website,
        },
      });
    }

    const appDate = new Date();
    appDate.setDate(appDate.getDate() - Math.round(sample.monthsAgo * 30));

    let nextDate: Date | null = null;
    if (sample.daysUntilNext !== null) {
      nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + sample.daysUntilNext);
    }

    const app = await prisma.application.create({
      data: {
        companyId: company.id,
        position: sample.position,
        status: sample.status,
        applicationDate: appDate,
        source: sample.portal,
        nextStep: sample.nextStep,
        nextStepDate: nextDate,
        notes: `Automatisch generierte Test-Bewerbung über ${sample.portal}.`,
      },
    });

    // Status Historie Eintrag erstellen
    await prisma.applicationStatusEvent.create({
      data: {
        applicationId: app.id,
        status: sample.status,
        note: `Initialer Status: ${sample.status}`,
        changedAt: appDate,
      },
    });

    createdList.push(app);
  }

  return createdList;
}
