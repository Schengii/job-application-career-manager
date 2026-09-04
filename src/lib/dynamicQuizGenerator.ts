// -----------------------------------------------------------------------------
// Dynamischer Stellen-Quiz-Generator
// -----------------------------------------------------------------------------
// Generiert maßgeschneiderte Fachfragen und Code-Snippets exakt basierend auf
// dem geforderten Tech-Stack und Anforderungsprofil einer konkreten Stellenanzeige.
// -----------------------------------------------------------------------------

export type JobQuizQuestion = {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  interviewTakeaway: string;
};

export function generateCustomJobQuiz(
  techStack: string | null | undefined,
  jobTitle?: string | null
): JobQuizQuestion[] {
  const stack = (techStack || "").toLowerCase();
  const title = (jobTitle || "").toLowerCase();

  const generatedQuestions: JobQuizQuestion[] = [];

  // 1. Next.js / Server Components
  if (stack.includes("next") || title.includes("next")) {
    generatedQuestions.push({
      id: "job-nextjs-rsc",
      category: "REACT19_FRAMEWORKS",
      difficulty: "ADVANCED",
      question: "In Next.js (App Router): Wann sollte eine Komponente mit 'use client' deklariert werden?",
      codeSnippet: `// Komponente A
export async function UserList() {
  const users = await db.user.findMany();
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// Komponente B
export function SearchInput({ onSearch }: { onSearch: (val: string) => void }) {
  const [val, setVal] = useState('');
  return <input value={val} onChange={e => setVal(e.target.value)} />;
}`,
      options: [
        "Beide Komponenten benötigen 'use client'",
        "Nur Komponente B benötigt 'use client', da sie interaktiven State (useState) und Browser-Eventhandler nutzt",
        "Nur Komponente A, weil Datenabfragen im Client laufen müssen",
        "Weder A noch B, Next.js erkennt Client-Code automatisch",
      ],
      correctOptionIndex: 1,
      explanation: "Server Components (RSC) sind der Standard im App Router. 'use client' markiert die Boundary für interaktive Komponenten mit Hooks (useState, useEffect) oder DOM-Eventhandlern.",
      interviewTakeaway: "Hebe im Gespräch hervor, dass RSC die JS-Bundle-Größe für den Browser minimieren und empfindliche DB-Logik auf dem Server halten.",
    });
  }

  // 2. TypeScript / Discriminated Unions / Satisfies
  if (stack.includes("typescript") || stack.includes("ts")) {
    generatedQuestions.push({
      id: "job-ts-unions",
      category: "TYPESCRIPT",
      difficulty: "ADVANCED",
      question: "Welchen Vorteil bietet eine Discriminated Union für API-Antworten in TypeScript?",
      codeSnippet: `type ApiResponse<T> =
  | { status: 'success'; data: T; timestamp: number }
  | { status: 'error'; error: string; code: number };

function handleResponse(res: ApiResponse<User>) {
  if (res.status === 'success') {
    console.log(res.data.name); // Typsicher!
  } else {
    console.error(res.error);    // res.data existiert hier nicht!
  }
}`,
      options: [
        "TypeScript kann Typen automatisch casten ohne Runtime-Checks",
        "Über das gemeinsame Literal-Feld 'status' verengt (narrows) TypeScript den Typ im Kontrollfluss absolut typsicher",
        "Vermeidet any-Typen nur beim Kompilieren, hat aber keine Auswirkung auf Autocomplete",
        "Ermöglicht dynamisches Hinzufügen von Feldern zur Laufzeit",
      ],
      correctOptionIndex: 1,
      explanation: "Discriminated Unions nutzen ein gemeinsames Diskriminator-Feld mit Literal-Typen. Im if- oder switch-Block verengt der TypeScript-Compiler den Typ automatisch.",
      interviewTakeaway: "Ein Standardbeispiel für sauberes API-State-Design ohne inkonsistente Zustände (wie z. B. { data?: User, error?: string }).",
    });
  }

  // 3. React 19 / State Management / Actions
  if (stack.includes("react") || title.includes("react") || title.includes("frontend")) {
    generatedQuestions.push({
      id: "job-react19-actions",
      category: "REACT19_FRAMEWORKS",
      difficulty: "ADVANCED",
      question: "Was löst React 19's 'useActionState' Hook bei asynchronen Formularaktionen?",
      codeSnippet: `const [state, formAction, isPending] = useActionState(
  async (prevState, formData) => {
    return await updateUser(formData);
  },
  initialState
);`,
      options: [
        "Verbindet das Formular mit Redux ohne Boilerplate",
        "Verwaltet Pending-Zustände, Fehlerrückmeldungen und optimistische Updates automatisch während asynchroner Server Actions",
        "Ersetzt CSS-Grid für responsive Formulare",
        "Schützt vor XSS-Angriffen in Input-Feldern",
      ],
      correctOptionIndex: 1,
      explanation: "useActionState kapselt das manuelle Verwalten von isSubmitting-, Error- und Success-States bei Formularen und asynchronen Transitionen nativ in React 19.",
      interviewTakeaway: "Zeigt, dass du auf dem neuesten Stand moderner React 19 Standards bist und nicht mehr veraltete useEffect-Workarounds nutzt.",
    });
  }

  // 4. CSS / Tailwind / UI Performance
  if (stack.includes("tailwind") || stack.includes("css") || title.includes("frontend")) {
    generatedQuestions.push({
      id: "job-tailwind-performance",
      category: "WEB_PERFORMANCE",
      difficulty: "INTERMEDIATE",
      question: "Warum ist Content-Visibility / Layout-Thrashing ein kritischer Faktor für den INP (Interaction to Next Paint) Score?",
      codeSnippet: `// Schlecht: Wiederholtes Lesen und Schreiben von DOM-Dimensionen
for (let i = 0; i < items.length; i++) {
  const height = items[i].offsetHeight; // Layout Read (erzwingt Reflow!)
  items[i].style.height = (height + 10) + 'px'; // Layout Write
}`,
      options: [
        "CSS-Animationen können nur im Main-Thread berechnet werden",
        "Forced Synchronous Layout blockiert den JavaScript Main-Thread und führt zu sichtbaren Rucklern bei Benutzerinteraktionen",
        "Tailwind-Klassen werden zur Laufzeit kompiliert",
        "Layout-Thrashing verbraucht zu viel Speicher im V8 Heap",
      ],
      correctOptionIndex: 1,
      explanation: "Wenn Lese- und Schreibzugriffe auf DOM-Layout-Eigenschaften abwechselnd erfolgen, muss der Browser das Layout synchron neu berechnen (Layout Thrashing), was den INP-Wert zerstört.",
      interviewTakeaway: "Wichtiges Thema für Frontend-Architekten: Batching von DOM-Updates und CSS-Transforms statt Breiten-/Höhen-Animationen.",
    });
  }

  // 5. Testing (Vitest, Playwright, RTL)
  generatedQuestions.push({
    id: "job-testing-rtl",
    category: "TYPESCRIPT",
    difficulty: "INTERMEDIATE",
    question: "Welche Abfrage-Priorität empfiehlt die React Testing Library (RTL) für barrierefreie und robuste Tests?",
    codeSnippet: `// Option A
const btn = container.querySelector('.submit-btn-primary');

// Option B
const btn = screen.getByRole('button', { name: /speichern/i });`,
    options: [
      "Option A (querySelector mit CSS-Klassen), weil CSS sich nie ändert",
      "Option B (getByRole), da Tests das Verhalten echter Nutzer und Screenreader abbilden und refactor-resistent sind",
      "getByTestId ist immer die bevorzugte Methode",
      "Snapshot-Tests sind immer vorzuziehen",
    ],
    correctOptionIndex: 1,
    explanation: "RTL folgt dem Prinzip: Je ähnlicher Tests der echten Nutzung der Software sind, desto mehr Vertrauen bieten sie. getByRole prüft semantisches HTML und Zugänglichkeit (A11y).",
    interviewTakeaway: "Signalisierst du im Interview, dass du getByRole und Accessible Testing schätzt, hebst du dich sofort positiv von Anfängern ab.",
  });

  return generatedQuestions;
}
