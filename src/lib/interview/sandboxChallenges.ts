// -----------------------------------------------------------------------------
// Interaktive Coding Challenges für Frontend-Entwickler
// -----------------------------------------------------------------------------

export interface CodingSandboxChallenge {
  id: string;
  title: string;
  category: "JAVASCRIPT" | "REACT_HOOK" | "TYPESCRIPT" | "ASYNC";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  description: string;
  initialCode: string;
  solutionCode: string;
  tests: {
    description: string;
    testFnString: string; // Funktion (fn) => boolean oder Promise<boolean>
  }[];
  hints: string[];
}

export const CODING_CHALLENGES: CodingSandboxChallenge[] = [
  {
    id: "debounce",
    title: "Implementiere debounce(fn, delay)",
    category: "JAVASCRIPT",
    difficulty: "MEDIUM",
    description:
      "Erstelle eine Funktion `debounce(func, wait)`, die die Ausführung von `func` verzögert, bis seit dem letzten Aufruf mindestens `wait` Millisekunden vergangen sind.",
    initialCode: `function debounce(func, wait) {
  let timeoutId;
  return function(...args) {
    // Implementierung hier
  };
}`,
    solutionCode: `function debounce(func, wait) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}`,
    tests: [
      {
        description: "Verzögert den Funktionsaufruf und ruft ihn nur einmal nach der Wartezeit auf",
        testFnString: `async (fn) => {
          let count = 0;
          const debounced = fn(() => count++, 50);
          debounced();
          debounced();
          debounced();
          if (count !== 0) return false;
          await new Promise(r => setTimeout(r, 80));
          return count === 1;
        }`,
      },
    ],
    hints: [
      "Verwende `clearTimeout(timeoutId)` vor jedem erneuten Starten des Timers.",
      "Achte darauf, Parameter über `...args` an die ursprüngliche Funktion weiterzugeben.",
    ],
  },
  {
    id: "deep-clone",
    title: "Deep Clone (Rekursives Objekt-Klonen)",
    category: "JAVASCRIPT",
    difficulty: "MEDIUM",
    description:
      "Schreibe eine Funktion `deepClone(value)`, die verschachtelte Objekte und Arrays tief kopiert, ohne Referenzen auf das Original beizubehalten.",
    initialCode: `function deepClone(value) {
  // Dein Code hier
}`,
    solutionCode: `function deepClone(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(deepClone);
  const copy = {};
  for (const key of Object.keys(value)) {
    copy[key] = deepClone(value[key]);
  }
  return copy;
}`,
    tests: [
      {
        description: "Klont primitive Werte unverändert",
        testFnString: `(fn) => fn(42) === 42 && fn("test") === "test" && fn(null) === null`,
      },
      {
        description: "Klont verschachtelte Objekte und Arrays ohne geteilte Referenz",
        testFnString: `(fn) => {
          const original = { a: 1, b: [2, 3], c: { d: 4 } };
          const cloned = fn(original);
          cloned.b.push(99);
          cloned.c.d = 999;
          return original.b.length === 2 && original.c.d === 4 && cloned.c.d === 999;
        }`,
      },
    ],
    hints: [
      "Prüfe zunächst mit `typeof value !== 'object' || value === null`.",
      "Behandle Arrays mit `Array.isArray(value)` gesondert.",
    ],
  },
  {
    id: "flatten-array",
    title: "Array Flatten (Tiefes Glätten)",
    category: "JAVASCRIPT",
    difficulty: "EASY",
    description:
      "Schreibe eine Funktion `flatten(arr)`, die ein beliebig tief verschachteltes Array in ein flaches 1D-Array überführt.",
    initialCode: `function flatten(arr) {
  // Dein Code hier
}`,
    solutionCode: `function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else {
      result.push(item);
    }
  }
  return result;
}`,
    tests: [
      {
        description: "Glättet verschachteltes Array [1, [2, [3, 4], 5], 6] zu [1, 2, 3, 4, 5, 6]",
        testFnString: `(fn) => {
          const res = fn([1, [2, [3, 4], 5], 6]);
          return JSON.stringify(res) === JSON.stringify([1, 2, 3, 4, 5, 6]);
        }`,
      },
    ],
    hints: ["Rekursion oder `reduce` eignet sich hervorragend."],
  },
];

export interface SandboxExecutionResult {
  success: boolean;
  results: {
    description: string;
    passed: boolean;
    error?: string;
  }[];
  errorMessage?: string;
}

export async function executeSandboxCode(userCode: string, challenge: CodingSandboxChallenge): Promise<SandboxExecutionResult> {
  try {
    // Erstelle Funktion im isolierten Scope
    const evaluatedFactory = new Function(`
      ${userCode}
      return ${challenge.id === "debounce" ? "debounce" : challenge.id === "deep-clone" ? "deepClone" : "flatten"};
    `);

    const userFunction = evaluatedFactory();
    if (typeof userFunction !== "function") {
      return {
        success: false,
        results: [],
        errorMessage: "Es wurde keine gültige Zielfunktion exportiert/definiert.",
      };
    }

    const testResults = [];
    let allPassed = true;

    for (const t of challenge.tests) {
      try {
        const testEvaluator = new Function(`return ${t.testFnString}`)();
        const testOutcome = await testEvaluator(userFunction);
        const passed = Boolean(testOutcome);
        if (!passed) allPassed = false;
        testResults.push({
          description: t.description,
          passed,
        });
      } catch (err) {
        allPassed = false;
        testResults.push({
          description: t.description,
          passed: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      success: allPassed,
      results: testResults,
    };
  } catch (err) {
    return {
      success: false,
      results: [],
      errorMessage: err instanceof Error ? err.message : "Syntax- oder Kompilierungsfehler",
    };
  }
}
