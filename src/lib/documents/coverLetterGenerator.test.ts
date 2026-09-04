import { describe, expect, it, vi, afterEach } from "vitest";
import { generateCoverLetter, generateFollowUpEmail, renderOpeningSentence } from "@/lib/documents/coverLetterGenerator";

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
  // Kein aiProvider/aiApiKey gesetzt -> generateOpeningSentenceWithAI() liefert
  // ohne Netzwerk-Mock direkt einen leeren String zurück (siehe aiService.ts,
  // getAiCompletion() bricht ohne Provider sofort ab). Damit üben die
  // Standard-Tests unten automatisch den Vorlagen-Fallback-Pfad aus.
};

describe("generateCoverLetter (ohne konfigurierten KI-Provider -> Vorlagen-Fallback)", () => {
  it("verwendet eine korrekte, geschlechtsspezifische Anrede mit Nachname statt Vorname", async () => {
    const { content } = await generateCoverLetter({
      company: { name: "Musterfirma GmbH", contactName: "Frau Dr. Julia Weber" },
      profile,
      position: "Frontend-Entwickler",
    });
    expect(content).toContain("Sehr geehrte Frau Dr. Weber,");
    expect(content).not.toContain("geehrte Frau Dr. Julia Weber");
  });

  it("verwendet die korrekte männliche Anrede", async () => {
    const { content } = await generateCoverLetter({
      company: { name: "Musterfirma GmbH", contactName: "Herr Thomas Klein" },
      profile,
      position: "Frontend-Entwickler",
    });
    expect(content).toContain("Sehr geehrter Herr Klein,");
  });

  it("fällt ohne Ansprechpartner auf die neutrale Anrede zurück", async () => {
    const { content } = await generateCoverLetter({
      company: { name: "Musterfirma GmbH" },
      profile,
      position: "Frontend-Entwickler",
    });
    expect(content).toContain("Sehr geehrte Damen und Herren,");
  });

  it("übernimmt den festen Anschreiben-Haupttext unverändert", async () => {
    const { content } = await generateCoverLetter({
      company: { name: "Musterfirma GmbH" },
      profile,
      position: "Frontend-Entwickler",
    });
    expect(content).toContain(profile.standardCoverLetterBody);
  });

  it("baut den Einleitungssatz aus der Vorlage mit Unternehmen & Position und meldet usedAiForOpening:false", async () => {
    const { content, usedAiForOpening } = await generateCoverLetter({
      company: { name: "Acme GmbH" },
      profile,
      position: "Softwareentwickler",
    });
    expect(content).toContain("hiermit bewerbe ich mich bei Acme GmbH als Softwareentwickler.");
    expect(usedAiForOpening).toBe(false);
  });

  it("nutzt für zwei unterschiedliche Unternehmen denselben Haupttext, aber unterschiedliche Kopfdaten", async () => {
    const { content: letterA } = await generateCoverLetter({ company: { name: "Firma A", city: "Köln" }, profile, position: "Entwickler" });
    const { content: letterB } = await generateCoverLetter({ company: { name: "Firma B", city: "München" }, profile, position: "Entwickler" });

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

  it("verwendet einen pro Unternehmen hinterlegten Einleitungssatz (Company.letterTemplate) anstelle der Vorlage/KI", async () => {
    const { content } = await generateCoverLetter({
      company: { name: "Acme GmbH", letterTemplate: "Ihre Mission hat mich sofort überzeugt" },
      profile,
      position: "Softwareentwickler",
    });
    expect(content).toContain("Ihre Mission hat mich sofort überzeugt.");
    expect(content).not.toContain("hiermit bewerbe ich mich bei Acme GmbH");
    // Der feste Haupttext bleibt trotz eigenem Einleitungssatz unverändert.
    expect(content).toContain(profile.standardCoverLetterBody);
  });

  it("zeigt einen Platzhalter-Hinweis, wenn noch kein fester Haupttext hinterlegt ist", async () => {
    const { content } = await generateCoverLetter({
      company: { name: "Musterfirma GmbH" },
      profile: { ...profile, standardCoverLetterBody: null },
      position: "Frontend-Entwickler",
    });
    expect(content).toContain("Noch kein fester Anschreiben-Text hinterlegt");
  });
});

describe("generateCoverLetter (KI-Provider konfiguriert, gemockter fetch)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const aiProfile = { ...profile, aiProvider: "openai", aiApiKey: "sk-test", aiModel: null };

  it("verwendet den von der KI formulierten, unternehmensspezifischen Einleitungssatz und meldet usedAiForOpening:true", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: "die Kombination aus React und TypeScript bei Acme GmbH hat mich sofort überzeugt." } }] }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const { content, usedAiForOpening } = await generateCoverLetter({
      company: { name: "Acme GmbH" },
      profile: aiProfile,
      position: "Frontend-Entwickler",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(usedAiForOpening).toBe(true);
    expect(content).toContain("die Kombination aus React und TypeScript bei Acme GmbH hat mich sofort überzeugt.");
    expect(content).not.toContain("hiermit bewerbe ich mich bei Acme GmbH");
    // Der feste Haupttext bleibt auch mit KI-generiertem Einleitungssatz unverändert.
    expect(content).toContain(profile.standardCoverLetterBody);
  });

  it("fällt bei einem fehlschlagenden KI-Request auf die Vorlage zurück, statt zu werfen", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Server Error", { status: 500 })));

    const { content, usedAiForOpening } = await generateCoverLetter({
      company: { name: "Acme GmbH" },
      profile: aiProfile,
      position: "Softwareentwickler",
    });

    expect(usedAiForOpening).toBe(false);
    expect(content).toContain("hiermit bewerbe ich mich bei Acme GmbH als Softwareentwickler.");
  });

  it("überspringt den KI-Request bei useAi:false (z.B. Massenaktionen) und nutzt direkt die Vorlage", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { usedAiForOpening } = await generateCoverLetter({
      company: { name: "Acme GmbH" },
      profile: aiProfile,
      position: "Softwareentwickler",
      useAi: false,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(usedAiForOpening).toBe(false);
  });

  it("überspringt den KI-Request, wenn ein Company.letterTemplate gesetzt ist (Vorrang vor KI)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { content } = await generateCoverLetter({
      company: { name: "Acme GmbH", letterTemplate: "Eigener Einstieg" },
      profile: aiProfile,
      position: "Softwareentwickler",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(content).toContain("Eigener Einstieg.");
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
