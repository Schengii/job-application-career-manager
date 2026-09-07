// -----------------------------------------------------------------------------
// Arbeitsvertrags- & Klausel-Checker (Heuristik- & Regel-Engine)
// -----------------------------------------------------------------------------
// Analysiert Vertragsentwürfe, Angebote oder Klauseln auf rechtliche Risiken,
// ungültige Formulierungen nach deutschem Arbeitsrecht (BGB / BAG) und
// Verhandlungspotenzial für Software-Entwickler.
// -----------------------------------------------------------------------------

export type ClauseSeverity = "CRITICAL" | "WARNING" | "INFO" | "GOOD";

export interface ClauseCheckResult {
  id: string;
  category: "OVERTIME" | "PROBATION" | "NOTICE" | "COMPETITION" | "IP_RIGHTS" | "HOURS_LOCATION";
  title: string;
  severity: ClauseSeverity;
  foundTextSnippet?: string;
  explanation: string;
  legalContext: string;
  negotiationTip: string;
}

export interface ContractAuditSummary {
  overallRisk: "LOW" | "MEDIUM" | "HIGH";
  score: number; // 0 (sehr riskant) bis 100 (top)
  criticalIssuesCount: number;
  warningsCount: number;
  positivePointsCount: number;
  clauses: ClauseCheckResult[];
}

export function auditEmploymentContractText(contractText: string): ContractAuditSummary {
  const text = contractText.toLowerCase();
  const clauses: ClauseCheckResult[] = [];

  // 1. Überstundenpauschale
  const hasOvertimeWord = /überstunden|mehrarbeit/i.test(text);
  const hasCompWord = /abgegolten|abgedeckt|erledigt/i.test(text);
  const overtimeSpecificLimit = /(bis zu|\d+\s*(stunden|std))/i;

  if (hasOvertimeWord && hasCompWord) {
    if (overtimeSpecificLimit.test(text)) {
      clauses.push({
        id: "overtime-capped",
        category: "OVERTIME",
        title: "Überstundenregelung (Konkret beziffert)",
        severity: "INFO",
        explanation: "Die Überstundenabgeltung nennt eine konkrete Stundenzahl. Dies ist nach BAG-Rechtsprechung grundsätzlich zulässig, sofern es ca. 10-15% der Arbeitszeit nicht übersteigt.",
        legalContext: "BAG Az. 5 AZR 517/09: Klauseln mit konkreter Begrenzung sind transparent und wirksam.",
        negotiationTip: "Prüfe, ob du im Gegenzug Zeitausgleich (Gleitzeitkonto / Freizeitausgleich) statt Verfall vereinbaren kannst.",
      });
    } else {
      clauses.push({
        id: "overtime-blanket-invalid",
        category: "OVERTIME",
        title: "Pauschale Überstundenabgeltung (Höchstwahrscheinlich unwirksam)",
        severity: "CRITICAL",
        explanation: "Formulierungen wie 'Etwaige Überstunden sind mit dem Grundgehalt vollumfänglich abgegolten' ohne konkrete Stundenobergrenze verstoßen gegen das Transparenzgebot.",
        legalContext: "Nach ständiger BAG-Rechtsprechung (§ 307 Abs. 1 Satz 2 BGB) unwirksam bei Nicht-Leitenden Angestellten.",
        negotiationTip: "Lass die Klausel streichen oder auf ein klares Freizeitausgleich-Konto (z. B. via Zeiterfassung) anpassen.",
      });
    }
  } else if (/zeiterfassung|gleitzeit|überstundenkonto|freizeitausgleich/i.test(text)) {
    clauses.push({
      id: "overtime-good",
      category: "OVERTIME",
      title: "Faire Zeiterfassung / Gleitzeitkonto",
      severity: "GOOD",
      explanation: "Überstunden werden erfasst und können abgefeiert oder ausgezahlt werden.",
      legalContext: "Entspricht dem Urteil des BAG zur Pflicht der Zeiterfassung.",
      negotiationTip: "Sehr gute Basis für Work-Life-Balance.",
    });
  }

  // 2. Probezeit
  if (/probezeit/i.test(text)) {
    if (/6\s*monate|sechs\s*monate/i.test(text)) {
      clauses.push({
        id: "probation-6m",
        category: "PROBATION",
        title: "Standard-Probezeit (6 Monate)",
        severity: "INFO",
        explanation: "6 Monate Probezeit mit 2 Wochen Kündigungsfrist ist der gesetzliche Maximalstandard nach § 622 Abs. 3 BGB.",
        legalContext: "§ 622 Abs. 3 BGB erlaubt maximal 6 Monate mit 2 Wochen Frist.",
        negotiationTip: "Bei hoher Vorerfahrung oder starker Verhandlungsposition kann auf 3 Monate verkürzt werden.",
      });
    } else if (/(\d+)\s*monate/i.test(text) && !/([1-6])\s*monate/i.test(text)) {
      clauses.push({
        id: "probation-too-long",
        category: "PROBATION",
        title: "Probezeit überschreitet 6 Monate",
        severity: "CRITICAL",
        explanation: "Eine Probezeit über 6 Monate hinaus mit verkürzter Kündigungsfrist ist unzulässig.",
        legalContext: "Gesetzliches Maximum nach § 622 Abs. 3 BGB beträgt sechs Monate.",
        negotiationTip: "Sofortige Reduzierung auf maximal 6 (oder 3) Monate fordern.",
      });
    }
  }

  // 3. Nachvertragliches Wettbewerbsverbot
  if (/wettbewerbsverbot/i.test(text) || /konkurrenzverbot/i.test(text)) {
    if (/entschädigung|karenzentschädigung|50\s*%/i.test(text)) {
      clauses.push({
        id: "competition-with-compensation",
        category: "COMPETITION",
        title: "Nachvertragliches Wettbewerbsverbot mit Karenzentschädigung",
        severity: "WARNING",
        explanation: "Das Verbot enthält eine Entschädigungszahlung (mind. 50% der letzten Bezüge), bindet dich aber nach dem Ausscheiden.",
        legalContext: "§§ 74 ff. HGB regeln die Wirksamkeitsvoraussetzungen.",
        negotiationTip: "Für Software-Entwickler oft unnötig einschränkend. Frage nach Streichung oder klarer Beschränkung auf direkte Kern-Wettbewerber.",
      });
    } else {
      clauses.push({
        id: "competition-without-comp-null",
        category: "COMPETITION",
        title: "Wettbewerbsverbot ohne Karenzentschädigung (Nichtigkeit)",
        severity: "CRITICAL",
        explanation: "Ein nachvertragliches Wettbewerbsverbot ohne Zusage einer gesetzlichen Karenzentschädigung von mind. 50% des Gehalts ist von Rechts wegen unverbindlich bzw. nichtig.",
        legalContext: "Gemäß § 74 Abs. 2 HGB zwingend nichtig.",
        negotiationTip: "Weise den Arbeitgeber freundlich darauf hin, dass diese Klausel rechtlich ungültig ist und gestrichen werden sollte.",
      });
    }
  }

  // 4. IP-Rechte & Private Nebenprojekte
  if (/urheberrecht|nutzungsrechte|diensterfindung|nebentätigkeit/i.test(text)) {
    if (/sämtliche|alle\s*arbeitsergebnisse|auch\s*außerhalb\s*der\s*arbeitszeit/i.test(text)) {
      clauses.push({
        id: "ip-broad",
        category: "IP_RIGHTS",
        title: "Sehr weitreichende Übertragung von Schutzrechten / Nebenprojekten",
        severity: "WARNING",
        explanation: "Die Klausel beansprucht möglicherweise Rechte an privatem Code oder Open-Source-Projekten, die außerhalb der Arbeitszeit entstehen.",
        legalContext: "§ 69b UrhG überträgt nur dienstlich im Rahmen des Arbeitsverhältnisses geschaffene Software.",
        negotiationTip: "Klarstellung fordern: 'Private Open-Source-Projekte und Arbeiten außerhalb der Dienstzeit verbleiben beim Arbeitnehmer'.",
      });
    } else {
      clauses.push({
        id: "ip-standard",
        category: "IP_RIGHTS",
        title: "Standard-Übertragung betrieblicher Urheberrechte",
        severity: "INFO",
        explanation: "Rechte an während der Arbeitszeit erstellter Software gehen an das Unternehmen.",
        legalContext: "Entspricht § 69b UrhG für Computerprogramme im Arbeitsverhältnis.",
        negotiationTip: "Völlig marktüblich für Angestelltenverhältnisse.",
      });
    }
  }

  // 5. Arbeitsort & Home-Office
  if (/home.?office|mobiles?\s*arbeiten|remote/i.test(text)) {
    if (/freiwillig|widerruflich|kein\s*rechtsanspruch/i.test(text)) {
      clauses.push({
        id: "remote-revocable",
        category: "HOURS_LOCATION",
        title: "Home-Office nur unter Vorbehalt / freiwillig",
        severity: "WARNING",
        explanation: "Der Arbeitgeber behält sich das Recht vor, die Home-Office-Erlaubnis jederzeit einseitig zu widerrufen.",
        legalContext: "Weisungsrecht des Arbeitgebers nach § 106 GewO.",
        negotiationTip: "Lass feste Mindesttage (z. B. 'mindestens 2 Tage wöchentlich remote') vertraglich festschreiben.",
      });
    } else {
      clauses.push({
        id: "remote-guaranteed",
        category: "HOURS_LOCATION",
        title: "Vereinbarung zu Mobilem Arbeiten / Remote",
        severity: "GOOD",
        explanation: "Mobiles Arbeiten ist explizit im Vertrag erwähnt.",
        legalContext: "Rechtssichere Individualabrede.",
        negotiationTip: "Kläre die Kostenerstattung für Arbeitsmittel (Monitor, Headset).",
      });
    }
  }

  // Berechnung Score
  const criticalCount = clauses.filter((c) => c.severity === "CRITICAL").length;
  const warningCount = clauses.filter((c) => c.severity === "WARNING").length;
  const goodCount = clauses.filter((c) => c.severity === "GOOD").length;

  let baseScore = 80;
  baseScore -= criticalCount * 25;
  baseScore -= warningCount * 10;
  baseScore += goodCount * 10;

  const score = Math.max(10, Math.min(100, baseScore));
  let overallRisk: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (criticalCount > 0 || score < 50) {
    overallRisk = "HIGH";
  } else if (warningCount > 1 || score < 75) {
    overallRisk = "MEDIUM";
  }

  return {
    overallRisk,
    score,
    criticalIssuesCount: criticalCount,
    warningsCount: warningCount,
    positivePointsCount: goodCount,
    clauses,
  };
}
