// -----------------------------------------------------------------------------
// Coding-Challenge Engine & Live-Praxisaufgaben für Frontend-Interviews
// -----------------------------------------------------------------------------
// Bietet strukturierte Frontend- und TypeScript-Coding-Challenges mit Test-Cases
// und einem sicheren Test-Runner für die Vorbereitung auf Live-Coding-Runden.
// -----------------------------------------------------------------------------

export type ChallengeCategory = "React" | "TypeScript" | "JavaScript" | "Performance";
export type ChallengeDifficulty = "Junior" | "Mid" | "Senior";

export type TestCase = {
  description: string;
  args: any[];
  expected: any;
};

export type CodingChallenge = {
  id: string;
  title: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  description: string;
  starterCode: string;
  solutionCode: string;
  hint: string;
  functionName: string;
  testCases: TestCase[];
};

export const CODING_CHALLENGES: CodingChallenge[] = [
  {
    id: "use-debounce-fn",
    title: "Debounce-Funktion (Search & Live-Filter)",
    category: "JavaScript",
    difficulty: "Junior",
    description:
      "Schreibe eine Hilfsfunktion `debounce(fn, delayMs)`, die sicherstellt, dass die übergebene Funktion erst nach Ablauf der Verzögerung ausgeführt wird.",
    functionName: "debounce",
    starterCode: `function debounce(fn, delayMs) {
  let timerId = null;
  return function(...args) {
    // Implementiere den Debounce-Mechanismus
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delayMs);
  };
}`,
    solutionCode: `function debounce(fn, delayMs) {
  let timerId = null;
  return function(...args) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delayMs);
  };
}`,
    hint: "Nutze `clearTimeout(timerId)` vor jedem neuen Aufruf und führe `fn` innerhalb von `setTimeout` aus.",
    testCases: [
      { description: "Liefert eine neue Funktion zurück", args: [() => {}, 100], expected: "function" },
    ],
  },
  {
    id: "group-by-key",
    title: "Array GroupBy (Bewerbungen nach Status gruppieren)",
    category: "TypeScript",
    difficulty: "Mid",
    description:
      "Implementiere `groupBy(items, keyFn)`, die ein Array von Objekten anhand einer Schlüssel-Funktion in ein Objekt gruppiert.",
    functionName: "groupBy",
    starterCode: `function groupBy(items, keyFn) {
  // Gruppiere items nach dem Rückgabewert von keyFn
  const result = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}`,
    solutionCode: `function groupBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});
}`,
    hint: "Verwende `reduce` oder eine einfache `for...of`-Schleife mit Schlüssel-Initialisierung.",
    testCases: [
      {
        description: "Gruppiert Bewerbungen nach Status",
        args: [
          [
            { id: "1", status: "SENT" },
            { id: "2", status: "INTERVIEW" },
            { id: "3", status: "SENT" },
          ],
          (item: any) => item.status,
        ],
        expected: {
          SENT: [{ id: "1", status: "SENT" }, { id: "3", status: "SENT" }],
          INTERVIEW: [{ id: "2", status: "INTERVIEW" }],
        },
      },
    ],
  },
  {
    id: "format-salary-range",
    title: "Gehaltsspannen-Formatierer (EUR / Währung)",
    category: "JavaScript",
    difficulty: "Junior",
    description:
      "Schreibe `formatSalaryRange(min, max, currency)`, die eine saubere deutsche Währungsspanne formatiert (z.B. '55.000 € – 65.000 €').",
    functionName: "formatSalaryRange",
    starterCode: `function formatSalaryRange(min, max, currency = "EUR") {
  // Formatiere min und max mit Tausendertrennpunkten
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency;
  const fmt = (num) => num.toLocaleString("de-DE");
  if (!max || min === max) return fmt(min) + " " + symbol;
  return fmt(min) + " " + symbol + " – " + fmt(max) + " " + symbol;
}`,
    solutionCode: `function formatSalaryRange(min, max, currency = "EUR") {
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency;
  const fmt = (num) => num.toLocaleString("de-DE");
  if (!max || min === max) return \`\${fmt(min)} \${symbol}\`;
  return \`\${fmt(min)} \${symbol} – \${fmt(max)} \${symbol}\`;
}`,
    hint: "Verwende `toLocaleString('de-DE')` für die deutsche Zahlenformatierung.",
    testCases: [
      {
        description: "Formatiert Spanne von 50k bis 60k EUR",
        args: [50000, 60000, "EUR"],
        expected: "50.000 € – 60.000 €",
      },
      {
        description: "Formatiert Einzelgehalt 65k EUR",
        args: [65000, 65000, "EUR"],
        expected: "65.000 €",
      },
    ],
  },
  {
    id: "virtual-list-window",
    title: "Virtual List Window Calculator (Performance)",
    category: "Performance",
    difficulty: "Senior",
    description:
      "Berechne für eine virtuelle Liste `calculateVirtualWindow(scrollTop, viewportHeight, itemHeight, totalItems, overscan)` den sichtbaren Indexbereich `[startIndex, endIndex]`.",
    functionName: "calculateVirtualWindow",
    starterCode: `function calculateVirtualWindow(scrollTop, viewportHeight, itemHeight, totalItems, overscan = 2) {
  // Berechne startIndex und endIndex
  const rawStart = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  
  const startIndex = Math.max(0, rawStart - overscan);
  const endIndex = Math.min(totalItems - 1, rawStart + visibleCount + overscan);
  
  return { startIndex, endIndex, totalHeight: totalItems * itemHeight };
}`,
    solutionCode: `function calculateVirtualWindow(scrollTop, viewportHeight, itemHeight, totalItems, overscan = 2) {
  const rawStart = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  const startIndex = Math.max(0, rawStart - overscan);
  const endIndex = Math.min(totalItems - 1, rawStart + visibleCount + overscan);
  return { startIndex, endIndex, totalHeight: totalItems * itemHeight };
}`,
    hint: "Teile den `scrollTop` durch die `itemHeight` und addiere den `overscan`-Puffer nach oben und unten.",
    testCases: [
      {
        description: "Berechnet Fensterausschnitt bei 100 Items",
        args: [200, 400, 50, 100, 2],
        expected: { startIndex: 2, endIndex: 14, totalHeight: 5000 },
      },
    ],
  },
];

export type ExecutionResult = {
  success: boolean;
  passedTests: number;
  totalTests: number;
  logs: string[];
  error?: string;
};

export function executeChallengeCode(
  challenge: CodingChallenge,
  code: string
): ExecutionResult {
  const logs: string[] = [];
  try {
    // Sichere Sandbox-Ausführung über Function-Konstruktor
    const runner = new Function(
      "testCases",
      `
      "use strict";
      ${code}
      
      if (typeof ${challenge.functionName} !== "function") {
        throw new Error("Funktion '${challenge.functionName}' wurde nicht deklariert.");
      }
      
      const fn = ${challenge.functionName};
      const results = [];
      
      for (const tc of testCases) {
        try {
          const actual = fn(...tc.args);
          results.push({ tc, actual, success: JSON.stringify(actual) === JSON.stringify(tc.expected) || (typeof actual === tc.expected) });
        } catch(e) {
          results.push({ tc, error: String(e), success: false });
        }
      }
      return results;
    `
    );

    const testResults: { tc: TestCase; actual?: any; error?: string; success: boolean }[] = runner(
      challenge.testCases
    );

    let passedTests = 0;
    for (const r of testResults) {
      if (r.success) {
        passedTests++;
        logs.push(`✓ Bestanden: ${r.tc.description}`);
      } else {
        logs.push(
          `✗ Fehlgeschlagen: ${r.tc.description} (Erwartet: ${JSON.stringify(
            r.tc.expected
          )}, Erhalten: ${JSON.stringify(r.actual || r.error)})`
        );
      }
    }

    return {
      success: passedTests === challenge.testCases.length,
      passedTests,
      totalTests: challenge.testCases.length,
      logs,
    };
  } catch (err: any) {
    return {
      success: false,
      passedTests: 0,
      totalTests: challenge.testCases.length,
      logs: [`Kompilier-/Laufzeitfehler: ${err.message || String(err)}`],
      error: err.message || String(err),
    };
  }
}
