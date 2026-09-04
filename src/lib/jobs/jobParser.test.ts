import { describe, expect, it } from "vitest";
import { parseJobText } from "@/lib/jobs/jobParser";

describe("parseJobText", () => {
  it("extrahiert Jobtitel, Unternehmen, Ort, Remote und Tech-Stack aus Freitext", () => {
    const raw = `
      Wir suchen ab sofort bei der CodeCraft GmbH in Bonn:
      Frontend Developer / React Entwickler (m/w/d)

      Dein Profil:
      - Fundierte Kenntnisse in TypeScript, React, HTML5 und CSS
      - Erfahrung mit REST APIs und Git
      - 100% Remote / Home-Office möglich
      - Gehalt: 50.000 € - 60.000 €
    `;

    const parsed = parseJobText(raw);

    expect(parsed.companyName).toContain("CodeCraft GmbH");
    expect(parsed.location).toBe("Bonn");
    expect(parsed.remote).toBe(true);
    expect(parsed.techStack).toContain("TypeScript");
    expect(parsed.techStack).toContain("React");
    expect(parsed.techStack).toContain("Git");
    expect(parsed.salaryInfo).toContain("50.000 €");
  });
});
