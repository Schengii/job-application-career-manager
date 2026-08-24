// -----------------------------------------------------------------------------
// Seed-Skript: befüllt die Datenbank mit realistischen Beispieldaten für die
// Jobsuche als Fachinformatiker für Anwendungsentwicklung (Frontend-Fokus,
// Region Bonn/Dortmund/Remote) — Profil, Ausbildungsdaten, Projekte,
// Unternehmen, Stellenangebote und Bewerbungen in verschiedenen Stadien.
//
// Ausführen mit: npx prisma db seed
// -----------------------------------------------------------------------------
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { computeMatchScore } from "../src/lib/matching";
import { generateCoverLetter } from "../src/lib/coverLetterGenerator";

const rawUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const filePath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
const adapter = new PrismaBetterSqlite3({ url: filePath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Datenbank ...");

  // 1) Präferenzen & Profil ---------------------------------------------------
  const preferences = await prisma.preferences.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      fullName: "Max Mustermann",
      email: "max.mustermann@example.com",
      phone: "+49 151 12345678",
      street: "Musterstraße 1",
      postalCode: "53111",
      city: "Bonn",
      desiredRole: "Fachinformatiker für Anwendungsentwicklung",
      techStack: "TypeScript,JavaScript,CSS,React,Next.js,HTML,Tailwind CSS",
      preferredLocations: "Bonn,Dortmund,Remote",
      searchRadiusKm: 60,
      remotePreference: "HYBRID",
      minSalary: 42000,
      profileSummary:
        "Motivierter Fachinformatiker für Anwendungsentwicklung mit Fokus auf moderne Frontend-Technologien, geprägt durch eine technische Erstausbildung und praktische Projekterfahrung.",
    },
  });

  await prisma.educationEntry.deleteMany({ where: { preferencesId: preferences.id } });
  await prisma.educationEntry.createMany({
    data: [
      {
        preferencesId: preferences.id,
        type: "SCHULE",
        title: "Mittlere Reife",
        institution: "Realschule Bonn",
        sortOrder: 0,
      },
      {
        preferencesId: preferences.id,
        type: "AUSBILDUNG",
        title: "Elektroniker für Betriebstechnik",
        institution: "Industrie- und Handelskammer Bonn/Rhein-Sieg",
        description:
          "Grundlegende technische Ausbildung mit Schwerpunkt auf elektrischen Anlagen, Steuerungstechnik und systematischer Fehleranalyse.",
        sortOrder: 1,
      },
      {
        preferencesId: preferences.id,
        type: "UMSCHULUNG",
        title: "Fachinformatiker für Anwendungsentwicklung",
        institution: "IHK-Umschulung, Bonn",
        description:
          "Umschulung mit Fokus auf Webentwicklung: TypeScript, JavaScript, React, CSS sowie Grundlagen der Softwarearchitektur und Datenbanken.",
        sortOrder: 2,
      },
    ],
  });

  await prisma.projectEntry.deleteMany({ where: { preferencesId: preferences.id } });
  await prisma.projectEntry.create({
    data: {
      preferencesId: preferences.id,
      title: "electroCheck-ai",
      description:
        "eine KI-gestützte Web-Anwendung zur Prüfung elektrischer Anlagen, die meine Erfahrung aus der Elektroniker-Ausbildung mit modernen Frontend-Technologien verbindet",
      techStack: "TypeScript,React,Next.js,CSS",
      role: "Konzeption & vollständige Frontend-Entwicklung",
      sortOrder: 0,
    },
  });

  // 2) Unternehmen --------------------------------------------------------------
  const companyData = [
    {
      name: "Rheinwerk Digital GmbH",
      street: "Rheinallee 12",
      postalCode: "53113",
      city: "Bonn",
      website: "https://rheinwerk-digital.example.com",
      contactName: "Frau Dr. Julia Weber",
      contactEmail: "j.weber@rheinwerk-digital.example.com",
      status: "IN_PROGRESS",
      notes: "Sehr freundliches Erstgespräch, gute Frontend-Team-Struktur.",
    },
    {
      name: "Dortmunder Softwareschmiede AG",
      street: "Westfalendamm 45",
      postalCode: "44141",
      city: "Dortmund",
      website: "https://softwareschmiede-do.example.com",
      contactName: "Herr Thomas Klein",
      contactEmail: "t.klein@softwareschmiede-do.example.com",
      status: "CONTACTED",
    },
    {
      name: "NRW.digital Systems",
      street: "Kaiserstraße 8",
      postalCode: "53113",
      city: "Bonn",
      website: "https://nrw-digital-systems.example.com",
      status: "LEAD",
    },
    {
      name: "codecentric AG",
      city: "Remote",
      website: "https://codecentric.example.com",
      status: "REJECTED",
      notes: "Absage nach zweiter Runde – Feedback: mehr Erfahrung mit Testing gewünscht.",
    },
  ];

  const companies = [];
  for (const data of companyData) {
    companies.push(await prisma.company.create({ data }));
  }
  const [rheinwerk, dortmunderSoftwareschmiede, nrwDigital, codecentric] = companies;

  // 3) Stellenangebote (simuliert von verschiedenen Portalen) ------------------
  const jobDefs = [
    {
      title: "Frontend-Entwickler (m/w/d) TypeScript/React",
      description:
        "Wir suchen Verstärkung für unser Frontend-Team: Du entwickelst moderne, responsive Weboberflächen und arbeitest eng mit UX-Designern und Backend-Entwicklern zusammen.",
      portalSource: "STEPSTONE",
      sourceUrl: "https://www.stepstone.de/stellenangebote/frontend-entwickler-1001",
      location: "Bonn",
      remote: false,
      requirementsProfile:
        "Abgeschlossene Ausbildung als Fachinformatiker Anwendungsentwicklung, gute Kenntnisse in TypeScript und React.",
      techStack: "TypeScript,React,CSS,Next.js",
      salaryInfo: "45.000 € - 55.000 € / Jahr",
      companyId: rheinwerk.id,
    },
    {
      title: "Fachinformatiker Anwendungsentwicklung (m/w/d) - Frontend",
      description:
        "Du übernimmst die Weiterentwicklung unserer Kundenportale im Frontend-Bereich und bringst dich aktiv bei Architekturentscheidungen ein.",
      portalSource: "GETINIT",
      sourceUrl: "https://www.getinit.de/stellenangebote/fachinformatiker-frontend-1002",
      location: "Dortmund",
      remote: false,
      requirementsProfile: "Kenntnisse in TypeScript, JavaScript, CSS; erste Erfahrung mit React von Vorteil.",
      techStack: "TypeScript,JavaScript,CSS",
      salaryInfo: "42.000 € - 50.000 € / Jahr",
      companyId: dortmunderSoftwareschmiede.id,
    },
    {
      title: "Junior Web Developer (m/w/d) - Remote möglich",
      description:
        "Als Teil unseres agilen Entwicklungsteams gestaltest du Benutzeroberflächen für unsere Web-Anwendungen und sorgst für sauberen, wartbaren Code.",
      portalSource: "INDEED",
      sourceUrl: "https://www.indeed.de/stellenangebote/junior-web-developer-1003",
      location: "Remote",
      remote: true,
      requirementsProfile: "TypeScript/JavaScript-Kenntnisse, CSS, idealerweise erste Praxiserfahrung.",
      techStack: "TypeScript,JavaScript,CSS,HTML",
      salaryInfo: "40.000 € - 48.000 € / Jahr",
      companyId: nrwDigital.id,
    },
    {
      title: "React Developer (m/w/d)",
      description: "Entwicklung und Pflege von React-basierten Kundenanwendungen im agilen Team.",
      portalSource: "ARBEITSAGENTUR",
      sourceUrl: "https://www.arbeitsagentur.de/jobsuche/stellenangebote-1004",
      location: "Köln (Remote möglich)",
      remote: true,
      requirementsProfile: "Sehr gute React- und TypeScript-Kenntnisse, Erfahrung mit Testing wünschenswert.",
      techStack: "TypeScript,React,GraphQL",
      salaryInfo: "48.000 € - 58.000 € / Jahr",
      companyId: codecentric.id,
    },
  ];

  const jobs = [];
  for (const job of jobDefs) {
    const matchScore = computeMatchScore({ job, preferences });
    jobs.push(await prisma.jobPosting.create({ data: { ...job, matchScore } }));
  }
  const [job1, job2, , job4] = jobs;

  // 4) Bewerbungen in unterschiedlichen Stadien --------------------------------
  const app1 = await prisma.application.create({
    data: {
      position: job1.title,
      status: "INTERVIEW",
      applicationDate: new Date("2026-07-15"),
      nextStep: "Vorstellungsgespräch am 02.09.2026, 10:00 Uhr",
      nextStepDate: new Date("2026-09-02T10:00:00"),
      notes: "Erstes Telefoninterview lief sehr gut, technisches Interview steht noch aus.",
      source: "STEPSTONE",
      companyId: rheinwerk.id,
      jobPostingId: job1.id,
      statusEvents: {
        create: [
          { status: "DRAFT", note: "Bewerbung erstellt", changedAt: new Date("2026-07-10") },
          { status: "SENT", note: "Bewerbung versendet", changedAt: new Date("2026-07-15") },
          { status: "INTERVIEW", note: "Einladung zum Gespräch erhalten", changedAt: new Date("2026-07-28") },
        ],
      },
    },
  });

  const app2 = await prisma.application.create({
    data: {
      position: job2.title,
      status: "SENT",
      applicationDate: new Date("2026-08-05"),
      nextStep: "Rückmeldung abwarten",
      notes: "Initiativ über GetInIT beworben.",
      source: "GETINIT",
      companyId: dortmunderSoftwareschmiede.id,
      jobPostingId: job2.id,
      statusEvents: {
        create: [
          { status: "DRAFT", note: "Bewerbung erstellt", changedAt: new Date("2026-08-01") },
          { status: "SENT", note: "Bewerbung versendet", changedAt: new Date("2026-08-05") },
        ],
      },
    },
  });

  const app3 = await prisma.application.create({
    data: {
      position: "React Developer (m/w/d)",
      status: "REJECTED",
      applicationDate: new Date("2026-06-20"),
      notes: "Absage nach zweiter Gesprächsrunde erhalten.",
      source: "ARBEITSAGENTUR",
      companyId: codecentric.id,
      jobPostingId: job4.id,
      statusEvents: {
        create: [
          { status: "DRAFT", note: "Bewerbung erstellt", changedAt: new Date("2026-06-15") },
          { status: "SENT", note: "Bewerbung versendet", changedAt: new Date("2026-06-20") },
          { status: "INTERVIEW", note: "Zwei Gesprächsrunden geführt", changedAt: new Date("2026-07-02") },
          { status: "REJECTED", note: "Absage erhalten", changedAt: new Date("2026-07-18") },
        ],
      },
    },
  });

  await prisma.application.create({
    data: {
      position: "Frontend-Entwickler (m/w/d)",
      status: "DRAFT",
      notes: "Initiativbewerbung in Vorbereitung.",
      companyId: nrwDigital.id,
      statusEvents: { create: [{ status: "DRAFT", note: "Bewerbung angelegt" }] },
    },
  });

  // 5) Dokumente (Metadaten, keine echten Dateien im Seed) ----------------------
  const cv = await prisma.document.create({
    data: { name: "Lebenslauf Max Mustermann", category: "LEBENSLAUF" },
  });
  const zeugnisSchule = await prisma.document.create({
    data: { name: "Zeugnis Mittlere Reife", category: "ZEUGNIS_SCHULE" },
  });
  const zeugnisAusbildung = await prisma.document.create({
    data: { name: "Ausbildungszeugnis Elektroniker für Betriebstechnik", category: "ZEUGNIS_AUSBILDUNG" },
  });
  const zeugnisUmschulung = await prisma.document.create({
    data: { name: "Zeugnis Umschulung Fachinformatiker AE", category: "ZEUGNIS_UMSCHULUNG" },
  });
  const referenz = await prisma.document.create({
    data: { name: "Projektreferenz electroCheck-ai", category: "REFERENZ", description: "GitHub-Link & Kurzbeschreibung" },
  });

  for (const app of [app1, app2, app3]) {
    await prisma.applicationDocument.createMany({
      data: [cv, zeugnisAusbildung, zeugnisUmschulung, referenz].map((d) => ({
        applicationId: app.id,
        documentId: d.id,
      })),
    });
  }
  await prisma.applicationDocument.create({ data: { applicationId: app1.id, documentId: zeugnisSchule.id } });

  // 6) Anschreiben generieren für die aktive Bewerbung (Interview-Status) -------
  const profileForLetter = await prisma.preferences.findUniqueOrThrow({
    where: { id: "default" },
    include: { educationEntries: true, projectEntries: true },
  });
  const company1 = await prisma.company.findUniqueOrThrow({ where: { id: rheinwerk.id } });

  const coverLetterContent = generateCoverLetter({
    company: company1,
    job: job1,
    profile: profileForLetter,
    position: app1.position,
  });

  await prisma.coverLetter.create({
    data: { applicationId: app1.id, content: coverLetterContent, status: "SENT" },
  });

  const coverLetterContent2 = generateCoverLetter({
    company: dortmunderSoftwareschmiede,
    job: job2,
    profile: profileForLetter,
    position: app2.position,
  });
  await prisma.coverLetter.create({
    data: { applicationId: app2.id, content: coverLetterContent2, status: "SENT" },
  });

  console.log("✅ Seeding abgeschlossen:");
  console.log(`   ${companies.length} Unternehmen, ${jobs.length} Stellenangebote, 4 Bewerbungen`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding fehlgeschlagen:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
