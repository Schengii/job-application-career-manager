import { describe, it, expect } from "vitest";
import { EMAIL_TEMPLATES, renderEmailTemplate } from "@/lib/documents/emailTemplates";

describe("emailTemplates", () => {
  it("ersetzt Platzhalter in Betreff und Nachrichtentext sauber", () => {
    const template = EMAIL_TEMPLATES.find((t) => t.id === "INITIAL_APPLICATION")!;
    const rendered = renderEmailTemplate(template, {
      company: "InnoTech GmbH",
      position: "Frontend Entwickler",
      contactName: "Herr Müller",
      myFullName: "Max Mustermann",
    });

    expect(rendered.subject).toBe("Bewerbung als Frontend Entwickler – Max Mustermann");
    expect(rendered.body).toContain("Sehr geehrte/r Herr Müller");
    expect(rendered.body).toContain("InnoTech GmbH");
    expect(rendered.body).toContain("Max Mustermann");
  });

  it("fällt bei fehlendem Ansprechpartner auf 'Damen und Herren' zurück", () => {
    const template = EMAIL_TEMPLATES.find((t) => t.id === "FOLLOW_UP_FRIENDLY")!;
    const rendered = renderEmailTemplate(template, {
      company: "DevAG",
      position: "React Dev",
    });

    expect(rendered.body).toContain("Sehr geehrte/r Damen und Herren");
  });
});
