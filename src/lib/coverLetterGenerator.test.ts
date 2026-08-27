import { describe, expect, it } from "vitest";
import { generateCoverLetter, generateFollowUpEmail, renderOpeningSentence } from "./coverLetterGenerator";

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
  standardCoverLetterBody:
    "Während meiner Umschulung habe ich mir fundierte Kenntnisse in TypeScript und React erarbeitet.\n\nBesonders stolz bin ich auf mein Projekt „electroCheck-ai“.",
  coverLetterOpeningSentence: "hiermit bewerbe ich mich bei {company} als {position}.",
};

describe("generateCoverLetter", () => {
  it("verwendet eine korrekte, geschlechtsspezifische Anrede mit Nachname statt Vorname", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH", contactName: "Frau Dr. Julia Weber" },
      profile,
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain("Sehr geehrte Frau Dr. Weber,");
    expect(letter).not.toContain("geehrte Frau Dr. Julia Weber");
  });

  it("verwendet die korrekte männliche Anrede", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH", contactName: "Herr Thomas Klein" },
      profile,
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain("Sehr geehrter Herr Klein,");
  });

  it("fällt ohne Ansprechpartner auf die neutrale Anrede zurück", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH" },
      profile,
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain("Sehr geehrte Damen und Herren,");
  });

  it("übernimmt den festen Anschreiben-Haupttext unverändert", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH" },
      profile,
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain(profile.standardCoverLetterBody);
  });

  it("baut den Einleitungssatz aus der Vorlage mit Unternehmen & Position", () => {
    const letter = generateCoverLetter({
      company: { name: "Acme GmbH" },
      profile,
      position: "Softwareentwickler",
    });
    expect(letter).toContain("hiermit bewerbe ich mich bei Acme GmbH als Softwareentwickler.");
  });

  it("nutzt für zwei unterschiedliche Unternehmen denselben Haupttext, aber unterschiedliche Kopfdaten", () => {
    const letterA = generateCoverLetter({ company: { name: "Firma A", city: "Köln" }, profile, position: "Entwickler" });
    const letterB = generateCoverLetter({ company: { name: "Firma B", city: "München" }, profile, position: "Entwickler" });

    // Kopfbereich (Empfänger-Adresse) unterscheidet sich ...
    expect(letterA).toContain("Firma A");
    expect(letterA).toContain("Köln");
    expect(letterB).toContain("Firma B");
    expect(letterB).toContain("München");
    // ... der feste Haupttext bleibt in beiden identisch.
    const bodyA = letterA.split(profile.standardCoverLetterBody!.split("\n\n")[0])[1];
    const bodyB = letterB.split(profile.standardCoverLetterBody!.split("\n\n")[0])[1];
    expect(bodyA).toBe(bodyB);
  });

  it("verwendet einen pro Unternehmen hinterlegten Einleitungssatz (Company.letterTemplate) anstelle der Vorlage", () => {
    const letter = generateCoverLetter({
      company: { name: "Acme GmbH", letterTemplate: "Ihre Mission hat mich sofort überzeugt" },
      profile,
      position: "Softwareentwickler",
    });
    expect(letter).toContain("Ihre Mission hat mich sofort überzeugt.");
    expect(letter).not.toContain("hiermit bewerbe ich mich bei Acme GmbH");
    // Der feste Haupttext bleibt trotz eigenem Einleitungssatz unverändert.
    expect(letter).toContain(profile.standardCoverLetterBody);
  });

  it("zeigt einen Platzhalter-Hinweis, wenn noch kein fester Haupttext hinterlegt ist", () => {
    const letter = generateCoverLetter({
      company: { name: "Musterfirma GmbH" },
      profile: { ...profile, standardCoverLetterBody: null },
      position: "Frontend-Entwickler",
    });
    expect(letter).toContain("Noch kein fester Anschreiben-Text hinterlegt");
  });
});

describe("renderOpeningSentence", () => {
  it("ersetzt {company} und {position} in der Vorlage", () => {
    expect(renderOpeningSentence("Bewerbung bei {company} als {position}", "Acme GmbH", "Entwickler")).toBe(
      "Bewerbung bei Acme GmbH als Entwickler."
    );
  });

  it("fällt ohne Vorlage auf einen Standardsatz zurück", () => {
    expect(renderOpeningSentence(null, "Acme GmbH", "Entwickler")).toBe(
      "mit großem Interesse habe ich Ihre Stellenanzeige für die Position als Entwickler bei Acme GmbH gelesen."
    );
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
