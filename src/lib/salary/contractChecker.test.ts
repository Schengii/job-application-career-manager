import { describe, it, expect } from "vitest";
import { auditEmploymentContractText } from "./contractChecker";

describe("contractChecker", () => {
  it("erkennt unzulässige pauschale Überstundenabgeltung als CRITICAL", () => {
    const text = `
      § 4 Vergütung
      Das Monatsgehalt beträgt 4.500 Euro brutto. Etwaig anfallende Überstunden sind mit dem Gehalt vollumfänglich abgegolten.
    `;

    const audit = auditEmploymentContractText(text);
    expect(audit.overallRisk).toBe("HIGH");
    expect(audit.criticalIssuesCount).toBeGreaterThanOrEqual(1);
    const overtimeClause = audit.clauses.find((c) => c.category === "OVERTIME");
    expect(overtimeClause?.severity).toBe("CRITICAL");
    expect(overtimeClause?.title).toContain("Pauschale Überstundenabgeltung");
  });

  it("erkennt zulässige bezifferte Überstunden als INFO", () => {
    const text = `
      § 4 Vergütung
      Mit der Vergütung sind bis zu 10 Überstunden im Monat abgegolten.
    `;

    const audit = auditEmploymentContractText(text);
    const overtimeClause = audit.clauses.find((c) => c.category === "OVERTIME");
    expect(overtimeClause?.severity).toBe("INFO");
  });

  it("erkennt nichtiges Wettbewerbsverbot ohne Karenzentschädigung", () => {
    const text = `
      § 12 Nachvertragliches Wettbewerbsverbot
      Der Arbeitnehmer verpflichtet sich, nach Beendigung des Arbeitsverhältnisses für die Dauer von einem Jahr nicht für ein Konkurrenzunternehmen tätig zu werden.
    `;

    const audit = auditEmploymentContractText(text);
    const compClause = audit.clauses.find((c) => c.category === "COMPETITION");
    expect(compClause?.severity).toBe("CRITICAL");
    expect(compClause?.explanation).toContain("Karenzentschädigung");
  });

  it("bewertet fairen Vertrag mit Zeiterfassung und Mobilem Arbeiten positiv", () => {
    const text = `
      § 3 Arbeitszeit & Zeiterfassung
      Die Arbeitszeit wird über ein elektronisches Gleitzeitkonto erfasst.
      § 8 Mobiles Arbeiten
      Dem Arbeitnehmer steht es frei, bis zu 3 Tage pro Woche remote zu arbeiten.
    `;

    const audit = auditEmploymentContractText(text);
    expect(audit.overallRisk).toBe("LOW");
    expect(audit.positivePointsCount).toBeGreaterThanOrEqual(2);
    expect(audit.score).toBeGreaterThanOrEqual(80);
  });
});
