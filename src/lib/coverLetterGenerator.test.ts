import { describe, expect, it } from "vitest";
import { generateCoverLetter, generateFollowUpEmail } from "./coverLetterGenerator";

const profile = {
  fullName: "Max Mustermann",
  email: "max@example.com",
  phone: "0151 12345678",
  street: "Musterstraße 1",
  postalCode: "53111",
  city: "Bonn",
  desiredRole: "Fachinformatiker für Anwendungsentwicklung",
  techStack: "TypeScript,React,CSS",
  profileSummary: "Motivierter Fachinformatiker mit Frontend-Fokus.",
  educationEntries: [
    { type: "AUSBILDUNG", title: "Elektroniker für Betriebstechnik", institution: "IHK Bonn" },
    { type: "UMSCHULUNG", title: "Fachinformatiker für Anwendungsentwicklung", institution: "IHK Bonn" },
  ],
  projectEntries: [
    { title: "electroCheck-ai", description: "eine KI-gestützte Prüf-Anwendung", techStack: "TypeScript,React" },
    { title: "career-dashboard", description: "ein modernes Dashboard zur Verwaltung", techStack: "Next.js,TypeScript" },
  ],
};

describe("generateCoverLetter", () => {
  it("verwendet eine korrekte, geschlechtsspezifische Anrede mit Nachname statt Vorname", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH", contactName: "Frau Dr. Julia Weber" },
      job: null,
      profile,
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain("Sehr geehrte Frau Dr. Weber,");
    expect(letter).not.toContain("geehrte Frau Dr. Julia Weber");
  });

  it("verwendet die korrekte männliche Anrede", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH", contactName: "Herr Thomas Klein" },
      job: null,
      profile,
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain("Sehr geehrter Herr Klein,");
  });

  it("fällt ohne Ansprechpartner auf die neutrale Anrede zurück", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH" },
      job: null,
      profile,
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain("Sehr geehrte Damen und Herren,");
  });

  it("fügt zwischen Projektbeschreibung und Folgesatz ein Satzzeichen ein (Regression)", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH" },
      job: null,
      profile,
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain("eine KI-gestützte Prüf-Anwendung. Dieses Projekt");
  });

  it("unterstützt die Tonalität CLASSIC mit formeller Ansprache", () => {
    const letter = generateCoverLetter({
      company: { name: "Großkonzern AG" },
      job: null,
      profile,
      position: "Softwareentwickler",
      tone: "CLASSIC",
    });
    expect(letter).toContain("hiermit bewerbe ich mich mit großem Interesse");
    expect(letter).toContain("Über die Gelegenheit, mich Ihnen in einem persönlichen Vorstellungsgespräch vorzustellen");
  });

  it("unterstützt die Tonalität STARTUP mit agilem Fokus", () => {
    const letter = generateCoverLetter({
      company: { name: "Tech Startup GmbH" },
      job: null,
      profile,
      position: "Frontend-Entwickler",
      tone: "STARTUP",
    });
    expect(letter).toContain("Ihre Ausschreibung für die Rolle als \"Frontend-Entwickler\" bei Tech Startup GmbH hat mich sofort begeistert");
    expect(letter).toContain("Lassen Sie uns gerne in einem Kennenlerngespräch");
  });

  it("unterstützt die Tonalität DETAILED mit Fokus auf Umschulung & Tech-Stack", () => {
    const letter = generateCoverLetter({
      company: { name: "DevOps Solutions GmbH" },
      job: null,
      profile,
      position: "Fullstack Developer",
      tone: "DETAILED",
    });
    expect(letter).toContain("mit großem Enthusiasmus bewerbe ich mich");
    expect(letter).toContain("Besonderen Wert lege ich auf modulare Komponenten");
  });

  it("erlaubt die gezielte Auswahl des hervorzuhebenden Projekts", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH" },
      job: null,
      profile,
      position: "Frontend-Entwickler",
      highlightProjectTitle: "career-dashboard",
    });
    expect(letter).toContain("career-dashboard");
    expect(letter).toContain("ein modernes Dashboard zur Verwaltung");
  });
});

describe("generateFollowUpEmail", () => {
  it("erstellt eine strukturierte Nachfass-E-Mail mit Betreff und passender Anrede", () => {
    const email = generateFollowUpEmail({
      company: { name: "Musterfirma GmbH", contactName: "Herr Michael Schmidt" },
      position: "Frontend Developer",
      applicationDate: new Date("2026-08-01"),
      profile,
    });
    expect(email.subject).toContain("Nachfrage zu meiner Bewerbung als Frontend Developer");
    expect(email.body).toContain("Sehr geehrter Herr Schmidt,");
    expect(email.body).toContain("01.08.2026");
    expect(email.body).toContain("Musterfirma GmbH");
  });
});
