import { describe, expect, it } from "vitest";
import { generateCoverLetter } from "./coverLetterGenerator";

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
    // Der Vorname darf in der Anrede selbst nicht auftauchen, wohl aber im
    // Empfänger-Adressblock ("z. Hd. Frau Dr. Julia Weber") – dort ist der
    // volle Name korrekt.
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
    // Die Beschreibung im Fixture endet ohne Punkt – der Generator muss ihn ergänzen,
    // bevor "Dieses Projekt zeigt..." angehängt wird.
    expect(letter).toContain("eine KI-gestützte Prüf-Anwendung. Dieses Projekt zeigt");
  });

  it("enthält Absender-, Empfänger- und Grußformel", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH", street: "Hauptstr. 1", postalCode: "12345", city: "Berlin" },
      job: null,
      profile,
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain("Max Mustermann");
    expect(letter).toContain("Musterfirma GmbH");
    expect(letter).toContain("Mit freundlichen Grüßen");
  });

  it("bevorzugt job-spezifische Anforderungen gegenüber dem generischen Kurzprofil", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH" },
      job: { title: "Frontend-Entwickler", requirementsProfile: "Sehr gute TypeScript-Kenntnisse gefordert." },
      profile,
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain("Sehr gute TypeScript-Kenntnisse gefordert.");
    expect(letter).not.toContain("Motivierter Fachinformatiker mit Frontend-Fokus.");
  });
});
