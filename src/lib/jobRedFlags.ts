// -----------------------------------------------------------------------------
// Stellenanzeigen Red-Flag- & Green-Flag-Scanner
// -----------------------------------------------------------------------------
// Analysiert Anzeigentexte auf versteckte Warnsignale (unbezahlte Überstunden,
// veraltete Stacks, diffuse Anforderungen) und Qualitätsmerkmale (Transparenz,
// Weiterbildung, echte Remote-Kultur).
// -----------------------------------------------------------------------------

export type FlagItem = {
  id: string;
  title: string;
  description: string;
  matchedKeyword: string;
  severity?: "HIGH" | "MEDIUM";
};

export type JobFlagsAnalysis = {
  score: number; // 0 - 100 (Höher = Arbeitgeberfreundlicher & Attraktiver)
  redFlags: FlagItem[];
  greenFlags: FlagItem[];
  summary: string;
  interviewQuestions: string[];
};

type FlagRule = {
  id: string;
  title: string;
  description: string;
  patterns: RegExp[];
  severity?: "HIGH" | "MEDIUM";
};

const RED_FLAG_RULES: FlagRule[] = [
  {
    id: "family_culture",
    title: "Familiäre Atmosphäre / Wir sind eine Familie",
    description: "Wird im IT-Bereich häufig genutzt, um fehlende Work-Life-Balance oder unbezahlte Mehrarbeit zu rechtfertigen.",
    patterns: [/familie/i, /familiär/i, /familienatmosphäre/i],
    severity: "MEDIUM",
  },
  {
    id: "high_stress",
    title: "Hohe Belastbarkeit / Stressresistenz gefordert",
    description: "Deutet oft auf dauerhafte Unterbesetzung, mangelhaftes Projektmanagement und Deadlines ohne Puffer hin.",
    patterns: [/hohe belastbarkeit/i, /belastbar/i, /stressresistent/i, /hohe stressresistenz/i, /frustrationstoleranz/i],
    severity: "HIGH",
  },
  {
    id: "unpaid_trial",
    title: "Probearbeitstag / Umfangreiche Vorab-Aufgaben",
    description: "Kostenlose Entwicklungsarbeit oder unbezahlte Probetage vor dem ersten Fachgespräch sind im Softwarebereich unüblich.",
    patterns: [/probearbeitstag/i, /schnuppertag/i, /unbezahlt/i],
    severity: "HIGH",
  },
  {
    id: "legacy_stack",
    title: "Veraltete Technologie-Stacks",
    description: "Hinweis auf Monolithen ohne Refactoring-Budget (z. B. veraltetes PHP 5.x, Delphi oder jQuery-Wartung), die dem eigenen Marktwert schaden.",
    patterns: [/\bphp\s*5\b/i, /\bdelphi\b/i, /\bvb6\b/i, /\bvisual basic 6\b/i, /\bactionscript\b/i],
    severity: "HIGH",
  },
  {
    id: "vague_overtime",
    title: "Überstunden mit Gehalt abgegolten",
    description: "Pauschale Abgeltung von Überstunden ohne Zeiterfassung oder Freizeitausgleich.",
    patterns: [/mit dem gehalt abgegolten/i, /überstundenbereitschaft/i, /hohe flexibilität bei der arbeitszeit/i],
    severity: "HIGH",
  },
  {
    id: "allrounder_trap",
    title: "Eierlegende Wollmilchsau (Full-Fullstack)",
    description: "Eine einzelne Person soll Frontend, Backend, DevOps, Design, Support und Datenbank-Administration gleichzeitig stemmen.",
    patterns: [/mädchen für alles/i, /alleskönner/i, /wollmilchsau/i],
    severity: "MEDIUM",
  },
];

const GREEN_FLAG_RULES: FlagRule[] = [
  {
    id: "remote_friendly",
    title: "100% Remote / Freie Wohnortwahl",
    description: "Vertraglich garantiertes Home-Office ohne Präsenzpflichten.",
    patterns: [/100%\s*remote/i, /remote-first/i, /vollständig remote/i, /ortsunabhängig/i, /freie wohnortwahl/i],
  },
  {
    id: "learning_budget",
    title: "Weiterbildungsbudget & Konferenz-Besuche",
    description: "Fester Etat für Zertifizierungen, Fachbücher und Weiterbildung.",
    patterns: [/weiterbildungsbudget/i, /fortbildungsbudget/i, /konferenz/i, /zertifizier/i, /lernzeit/i, /udemy/i],
  },
  {
    id: "modern_stack",
    title: "Moderner Tech-Stack & CI/CD",
    description: "Arbeit mit zukunftssicheren Technologien wie React, TypeScript, Next.js und Automated Testing.",
    patterns: [/\bnext\.?js\b/i, /\btypescript\b/i, /\breact\s*(18|19)?\b/i, /\btailwind\b/i, /\bvitest\b/i, /\bplaywright\b/i, /\bci\/cd\b/i],
  },
  {
    id: "salary_transparency",
    title: "Transparente Gehaltsangabe",
    description: "Klares Gehaltsband direkt in der Ausschreibung statt intransparenter Verhandlungsklauseln.",
    patterns: [/gehalt/i, /vergütung/i, /€/i, /euro/i, /tarif/i],
  },
  {
    id: "hardware_choice",
    title: "Freie Hardware-Wahl (MacBook Pro / Linux)",
    description: "Moderne Arbeitsausstattung nach den Vorlieben der Entwickler.",
    patterns: [/hardware nach wahl/i, /macbook/i, /freie wahl der hardware/i, /freie betriebssystemwahl/i],
  },
  {
    id: "work_life_balance",
    title: "Überstundenausgleich & 30+ Urlaubstage",
    description: "Echte Zeiterfassung mit Freizeitausgleich und überdurchschnittlicher Urlaubsanspruch.",
    patterns: [/zeiterfassung/i, /gleitzeit/i, /30 tage urlaub/i, /überstundenkonto/i, /freizeitausgleich/i],
  },
];

export function analyzeJobRedFlags(text: string): JobFlagsAnalysis {
  const normalized = text || "";

  const redFlags: FlagItem[] = [];
  for (const rule of RED_FLAG_RULES) {
    for (const pattern of rule.patterns) {
      const match = normalized.match(pattern);
      if (match) {
        redFlags.push({
          id: rule.id,
          title: rule.title,
          description: rule.description,
          matchedKeyword: match[0],
          severity: rule.severity,
        });
        break;
      }
    }
  }

  const greenFlags: FlagItem[] = [];
  for (const rule of GREEN_FLAG_RULES) {
    for (const pattern of rule.patterns) {
      const match = normalized.match(pattern);
      if (match) {
        greenFlags.push({
          id: rule.id,
          title: rule.title,
          description: rule.description,
          matchedKeyword: match[0],
        });
        break;
      }
    }
  }

  // Score Berechnung: Basis 70, +6 pro Green Flag, -10 pro Red Flag (High Severity -15)
  let score = 70 + greenFlags.length * 6;
  for (const rf of redFlags) {
    score -= rf.severity === "HIGH" ? 15 : 8;
  }
  score = Math.max(10, Math.min(98, score));

  // Generiere empfohlene Interview-Gegenfragen
  const interviewQuestions: string[] = [];
  if (redFlags.some((rf) => rf.id === "family_culture" || rf.id === "vague_overtime")) {
    interviewQuestions.push("Wie wird im Team mit Überstunden und Lastspitzen umgegangen? Gibt es eine Zeiterfassung mit Freizeitausgleich?");
  }
  if (redFlags.some((rf) => rf.id === "legacy_stack")) {
    interviewQuestions.push("Gibt es ein festes Budget für technisches Refactoring und Migrationen auf moderne Stacks (z. B. TypeScript/Next.js)?");
  }
  if (greenFlags.some((rf) => rf.id === "remote_friendly")) {
    interviewQuestions.push("Ist die Remote-Regelung fest im Arbeitsvertrag verankert oder an eine Betriebsvereinbarung gekoppelt?");
  }
  if (interviewQuestions.length === 0) {
    interviewQuestions.push("Wie sieht der typische Ablauf des Code-Reviews und Deployments in Ihrem Team aus?");
    interviewQuestions.push("Welche Weiterbildungsangebote und Konferenz-Möglichkeiten werden vom Unternehmen aktiv gefördert?");
  }

  let summary = "Ausgewogene Ausschreibung ohne Auffälligkeiten.";
  if (redFlags.length > 0 && greenFlags.length === 0) {
    summary = "Vorsicht geboten: Die Ausschreibung enthält mehrere potenzielle Warnsignale bezüglich Arbeitsbedingungen.";
  } else if (greenFlags.length >= 2 && redFlags.length === 0) {
    summary = "Hervorragende Ausschreibung mit überdurchschnittlichen Arbeitgeber-Benefits und modernen Standards!";
  }

  return {
    score,
    redFlags,
    greenFlags,
    summary,
    interviewQuestions,
  };
}
