// -----------------------------------------------------------------------------
// Tech-Assessment & Live-Coding Quiz Engine (React 19 / TypeScript 5+ / Next.js)
// -----------------------------------------------------------------------------

export type TechQuizCategory = "REACT_NEXT" | "TYPESCRIPT" | "PERF_CSS_ARCH";

export type TechQuizQuestion = {
  id: string;
  category: TechQuizCategory;
  categoryLabel: string;
  difficulty: "JUNIOR_MID" | "MID_SENIOR";
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  keyTakeaway: string;
};

export const TECH_QUIZ_QUESTIONS: TechQuizQuestion[] = [
  {
    id: "r19-use-action-state",
    category: "REACT_NEXT",
    categoryLabel: "React 19 & Next.js",
    difficulty: "MID_SENIOR",
    question: "Welchen primären Vorteil bietet der React 19 Hook `useActionState` gegenüber klassischem `useState` + `onSubmit` Handlern?",
    codeSnippet: `const [state, formAction, isPending] = useActionState(updateUserAction, initialState);`,
    options: [
      "Er ersetzt Redux vollständig und speichert Daten automatisch im LocalStorage.",
      "Er kapselt Pending-State, Fehlerrückgaben und die Server Action in einem Hook und funktioniert mit Progressive Enhancement auch ohne Client-JS.",
      "Er verhindert alle Re-Renders der gesamten Elternkomponente.",
      "Er führt synchrone SQL-Abfragen direkt im Browser aus.",
    ],
    correctIndex: 1,
    explanation: "`useActionState` (ehemals `useFormState`) standardisiert die Verwaltung von asynchronen Server Actions. Er liefert den aktuellen State, die gebundene Action-Funktion und ein automatisches `isPending`-Flag, ohne manuelles `try/catch` und `setIsLoading(true)`.",
    keyTakeaway: "React 19 bindet Form-Zustand und Pending-Status nativ an Server Actions.",
  },
  {
    id: "r19-server-client-boundary",
    category: "REACT_NEXT",
    categoryLabel: "React 19 & Next.js",
    difficulty: "MID_SENIOR",
    question: "Was passiert, wenn eine Server Component eine Client Component als Kind importiert und ihr Props übergibt?",
    codeSnippet: `// ServerComponent.tsx
import { ClientInteractiveCard } from './ClientInteractiveCard';

export function ServerComponent({ dbUser }) {
  return <ClientInteractiveCard user={dbUser} />;
}`,
    options: [
      "Die Client Component wird auf dem Server in reines HTML konvertiert und verliert alle Event Listener.",
      "Die Props müssen JSON-serialisierbar sein (oder spezielle React-Server-Funktionen/Promises sein), da sie über die Server-Client-Grenze als Flight-Datenstrom übertragen werden.",
      "Es entsteht ein Compile-Fehler, da Server Components niemals Client Components importieren dürfen.",
      "Die Datenbank-Verbindung wird automatisch an den Browser übermittelt.",
    ],
    correctIndex: 1,
    explanation: "Server Components übertragen Daten an Client Components über den React Server Component (RSC) Payload. Nicht serialisierbare Typen wie Klasseninstanzen oder Funktionen (außer Server Actions mit 'use server') können nicht übergeben werden.",
    keyTakeaway: "Props über die RSC-Boundary müssen JSON-serialisierbar sein.",
  },
  {
    id: "ts-satisfies-operator",
    category: "TYPESCRIPT",
    categoryLabel: "TypeScript 5+",
    difficulty: "JUNIOR_MID",
    question: "Welchen entscheidenden Vorteil hat der `satisfies`-Operator gegenüber einer expliziten Typannotation `const config: ThemeConfig = ...`?",
    codeSnippet: `type ThemeConfig = Record<string, string | { r: number; g: number; b: number }>;

const palette = {
  primary: "#4f46e5",
  accent: { r: 99, g: 102, b: 241 }
} satisfies ThemeConfig;`,
    options: [
      "Er konvertiert alle Werte zur Laufzeit in Strings.",
      "Er validiert, dass das Objekt zum Typ passt, behält aber die exakten Literal-Typen der Eigenschaften (z. B. palette.primary als String, palette.accent als Objekt) für perfekte Auto-Completion.",
      "Er deaktiviert die TypeScript-Typüberprüfung für dieses Objekt.",
      "Er kompiliert den Code schneller zu WebAssembly.",
    ],
    correctIndex: 1,
    explanation: "Mit `: ThemeConfig` würde TypeScript den Typ auf `string | { r, g, b }` verbreitern. `satisfies` prüft die Konformität, behält aber die spezifische Inferenz – z. B. weiß TS, dass `palette.primary.toLowerCase()` erlaubt ist, ohne Type Narrowing.",
    keyTakeaway: "`satisfies` validiert Typkonformität ohne Typverbreiterung (Narrow Types preserved).",
  },
  {
    id: "ts-discriminated-unions",
    category: "TYPESCRIPT",
    categoryLabel: "TypeScript 5+",
    difficulty: "MID_SENIOR",
    question: "Wie implementiert man Exhaustiveness Checking (Vollständigkeitsprüfung) bei einer Discriminated Union in TypeScript?",
    codeSnippet: `type AppEvent = 
  | { type: "SENT"; date: Date }
  | { type: "INTERVIEW"; location: string }
  | { type: "OFFER"; salary: number };

function handleEvent(e: AppEvent) {
  switch(e.type) {
    case "SENT": return ...;
    case "INTERVIEW": return ...;
    default:
      const _exhaustive: never = e;
      return _exhaustive;
  }
}`,
    options: [
      "Indem man im default-Zweig `const _check: any = e` zuweist.",
      "Indem man im default-Zweig `const _exhaustive: never = e` zuweist. Wenn ein Union-Mitglied (z.B. 'OFFER') nicht behandelt wurde, schlägt der TypeScript-Compiler mit einem Typfehler fehl.",
      "Indem man alle Properties optional mit `?` deklariert.",
      "TypeScript prüft switch-Statements immer automatisch zur Laufzeit.",
    ],
    correctIndex: 1,
    explanation: "Der Typ `never` stellt Werte dar, die niemals eintreten können. Wenn alle Fälle der Union im Switch abgedeckt sind, ist `e` im `default`-Zweig vom Typ `never`. Wurde ein Fall vergessen, ist `e` nicht `never` und TS meldet einen Build-Fehler.",
    keyTakeaway: "`const _exhaustive: never = val` garantiert Compile-Time-Sicherheit bei Enums/Unions.",
  },
  {
    id: "perf-event-loop-microtasks",
    category: "PERF_CSS_ARCH",
    categoryLabel: "Web Performance & Arch",
    difficulty: "MID_SENIOR",
    question: "In welcher Reihenfolge werden die Ausgaben in der JavaScript Event Loop ausgeführt?",
    codeSnippet: `console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
queueMicrotask(() => console.log("4"));
console.log("5");`,
    options: [
      "1, 2, 3, 4, 5",
      "1, 5, 3, 4, 2",
      "1, 5, 2, 3, 4",
      "5, 1, 3, 4, 2",
    ],
    correctIndex: 1,
    explanation: "Synchrone Tasks (1, 5) laufen zuerst. Danach wird der Microtask-Queue (Promise.then '3', queueMicrotask '4') vollständig abgearbeitet, bevor der nächste Macrotask (setTimeout '2') ausgeführt wird.",
    keyTakeaway: "Synchron ➔ Microtasks (Promises/queueMicrotask) ➔ Render ➔ Macrotasks (Timer/I/O).",
  },
  {
    id: "perf-core-web-vitals-inp",
    category: "PERF_CSS_ARCH",
    categoryLabel: "Web Performance & Arch",
    difficulty: "MID_SENIOR",
    question: "Welche Web-Metrik hat Google als Core Web Vital zur Messung der Reaktionsfähigkeit (Responsiveness) von Nutzerinteraktionen standardisiert?",
    options: [
      "FID (First Input Delay) – misst ausschließlich den ersten Klick.",
      "INP (Interaction to Next Paint) – misst die Latenz aller Klick-, Tastatur- und Touch-Interaktionen über den gesamten Seitenlebenszyklus.",
      "TTFB (Time to First Byte) – misst die Server-Antwortzeit.",
      "FCP (First Contentful Paint) – misst das Laden des ersten Textblocks.",
    ],
    correctIndex: 1,
    explanation: "INP (Interaction to Next Paint) hat FID offiziell als Core Web Vital abgelöst. Während FID nur die Verzögerung des ersten Klicks maß, bewertet INP die Zeit bis zum nächsten visuellen Frame für alle Interaktionen während des gesamten Besuchs.",
    keyTakeaway: "INP optimieren: Long Tasks aufteilen, React Transitions (`useTransition`) nutzen.",
  }
];

export type QuizEvaluationResult = {
  scorePct: number;
  totalQuestions: number;
  correctAnswers: number;
  categoryBreakdown: Record<string, { total: number; correct: number }>;
  feedbackSummary: string;
};

export function evaluateQuizSession(
  answers: Record<string, number>, // questionId -> selectedIndex
  questions: TechQuizQuestion[] = TECH_QUIZ_QUESTIONS
): QuizEvaluationResult {
  let correct = 0;
  const breakdown: Record<string, { total: number; correct: number }> = {};

  for (const q of questions) {
    if (!breakdown[q.category]) {
      breakdown[q.category] = { total: 0, correct: 0 };
    }
    breakdown[q.category].total++;

    const chosen = answers[q.id];
    if (chosen === q.correctIndex) {
      correct++;
      breakdown[q.category].correct++;
    }
  }

  const total = questions.length;
  const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;

  let feedbackSummary = "";
  if (scorePct >= 80) {
    feedbackSummary = "Hervorragendes Fachwissen! Du beherrschst moderne React 19, TypeScript- und Architektur-Konzepte sicher für anspruchsvolle Tech-Interviews.";
  } else if (scorePct >= 50) {
    feedbackSummary = "Gute Grundlagen vorhanden. Schau dir insbesondere die Detail-Erklärungen zu den verpassten Fragen an, um im Fachgespräch souverän zu punkten.";
  } else {
    feedbackSummary = "Nutze die Erklärungen und Kern-Takeaways, um dein Grundlagenwissen in React 19 und TypeScript systematisch zu festigen.";
  }

  return {
    scorePct,
    totalQuestions: total,
    correctAnswers: correct,
    categoryBreakdown: breakdown,
    feedbackSummary,
  };
}
