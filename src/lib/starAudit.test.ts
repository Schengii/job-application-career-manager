import { describe, it, expect } from "vitest";
import { auditAnswerWithStar } from "./starAudit";

describe("starAudit", () => {
  it("bewertet eine vollständige STAR-Antwort mit hoher Punktzahl", () => {
    const question = "Wie sind Sie mit einer schwierigen technischen Herausforderung umgegangen?";
    const answer = `In meinem Projekt electroCheck-ai war die zentrale Herausforderung, dass komplexe Formulareingaben
zu Rendering-Verzögerungen führten. Mein Ziel war es, die Formularvalidierung flüssig zu gestalten.
Ich habe die Architektur mit Zod-Schemas und React 19 Server Actions neu strukturiert und Debouncing integriert.
Dadurch sank die Antwortzeit um 40% und das Feedback der Testnutzer war durchweg positiv.`;

    const audit = auditAnswerWithStar(question, answer);
    expect(audit.totalScore).toBeGreaterThanOrEqual(80);
    expect(audit.rating).toBe("Hervorragend");
    expect(audit.dimensions).toHaveLength(4);
    expect(audit.improvedSampleAnswer).toBeDefined();
  });

  it("identifiziert Schwächen bei unvollständiger Kurzantwort", () => {
    const question = "Erzählen Sie von einem Konflikt.";
    const answer = "Es gab mal Streit.";

    const audit = auditAnswerWithStar(question, answer);
    expect(audit.totalScore).toBeLessThan(40);
    expect(audit.rating).toBe("Ausbaufähig");
    expect(audit.improvements.length).toBeGreaterThan(0);
  });
});
