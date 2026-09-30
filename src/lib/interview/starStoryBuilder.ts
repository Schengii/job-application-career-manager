// -----------------------------------------------------------------------------
// STAR-Story Builder (Situation, Task, Action, Result)
// -----------------------------------------------------------------------------
// Ermöglicht es Kandidaten, prägnante Verhaltens- und Erfahrungsbeispiele
// strukturiert nach der STAR-Methode zu erfassen, zu validieren, zu bewerten
// und direkt in ein druckbares oder für Teleprompter optimiertes Format zu exportieren.
// -----------------------------------------------------------------------------

export type StarStory = {
  id: string;
  title: string;
  category: "PROBLEM_SOLVING" | "TECH_LEADERSHIP" | "CONFLICT_RESOLUTION" | "FAILURE_LEARNING" | "OPTIMIZATION";
  situation: string;
  task: string;
  action: string;
  result: string;
  keyTakeaway?: string;
  techTags: string[];
  createdAt: string;
  updatedAt: string;
};

export const STAR_CATEGORIES: { id: StarStory["category"]; label: string; icon: string }[] = [
  { id: "OPTIMIZATION", label: "Performance & Optimierung", icon: "⚡" },
  { id: "PROBLEM_SOLVING", label: "Komplexe Fehlerbehebung", icon: "🛠️" },
  { id: "TECH_LEADERSHIP", label: "Architektur & Verantwortung", icon: "🏗️" },
  { id: "FAILURE_LEARNING", label: "Fehlerkultur & Learnings", icon: "🌱" },
  { id: "CONFLICT_RESOLUTION", label: "Teamzusammenarbeit & Kompromisse", icon: "🤝" },
];

export const STAR_PRESETS: Omit<StarStory, "id" | "createdAt" | "updatedAt">[] = [
  {
    title: "Performance-Engpass beim PDF-Export behoben",
    category: "OPTIMIZATION",
    situation: "Im Rahmen der Webanwendung electroCheck-ai kam es beim Rendern mehrseitiger technischer Prüfberichte im Browser zu spürbaren Lags und Speicherüberlastung auf mobilen Endgeräten.",
    task: "Meine Aufgabe war es, die Rendering-Pipeline so zu refaktorieren, dass Berichte mit bis zu 50 Seiten ohne UI-Blockade in unter 1 Sekunde generiert werden.",
    action: "Ich habe den PDF-Generator auf asynchrones Chunking umgestellt, rechenintensive Layoutberechnungen in Web Worker ausgelagert und ungenutzte Schriften mittels Font-Subsetting gestrafft.",
    result: "Die Generierungszeit sank von ca. 3,8s auf unter 750ms (-80%), der RAM-Verbrauch halbierte sich und die Kundenbewertungen stiegen messbar.",
    keyTakeaway: "Präzises Profiling im DevTools-Performance-Tab vor jeder Optimierung spart Tage an blindem Refactoring.",
    techTags: ["React", "TypeScript", "Web Worker", "Performance", "PDF"],
  },
  {
    title: "Kritischer Type-Mismatch in Produktions-API abgefangen",
    category: "PROBLEM_SOLVING",
    situation: "Nach einem Update eines externen REST-Dienstes lieferte die API unerwartet null statt leerer Arrays für Benutzerberechtigungen, was zu Runtime-Crashes führte.",
    task: "Ich musste das Problem sofort eindämmen und die Architektur dauerhaft gegen unzuverlässige Drittanbieter-Payloads absichern.",
    action: "Ich habe umgehend einen Hotfix mit Fallbacks deployed und im Anschluss Zod-Schemas an sämtlichen API-Grenzen etabliert, sodass Payloads zur Laufzeit typgeprüft und mit Default-Werten normalisiert werden.",
    result: "Die Fehlerrate bei Drittanbieter-Synchronisierungen sank auf 0% und künftige API-Inkompatibilitäten wurden bereits im Integrationstest abgefangen.",
    keyTakeaway: "Vertraue externen APIs niemals unvalidiert – strikte Runtime-Validierung an den Rändern schützt den gesamten Kern.",
    techTags: ["TypeScript", "Zod", "REST", "Error Handling", "Testing"],
  },
  {
    title: "Einführung von Komponententests & CI/CD-Pipeline",
    category: "TECH_LEADERSHIP",
    situation: "Im Ausbildungsteam wurden Features vor dem Release ausschließlich manuell durchgeklickt, wodurch Regressionen im Buchungsformular erst spät auffielen.",
    task: "Ich übernahm die Initiative, einen pragmatischen Test-Standard für Frontend-Komponenten zu etablieren, ohne die Release-Geschwindigkeit zu bremsen.",
    action: "Ich setzte Vitest und React Testing Library auf, erstellte Vorlagen für häufige Interaktionsfälle (Formulareingaben, Fehlerzustände) und band die Suite als GitHub Action ein.",
    result: "Die Testabdeckung für Kernflows stieg auf 82% und gemeldete Regressionsfehler reduzierten sich im Folgequartal um 65%.",
    keyTakeaway: "Ein Test-Framework nützt nur, wenn das Team einfache Templates und schnelle Feedbackschleifen unter 10 Sekunden hat.",
    techTags: ["Vitest", "Testing Library", "CI/CD", "GitHub Actions", "React"],
  },
];

export type StarValidationResult = {
  valid: boolean;
  score: number; // 0 - 100
  feedback: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
};

export function validateStarStory(story: Partial<StarStory>): StarValidationResult {
  const s = (story.situation || "").trim();
  const t = (story.task || "").trim();
  const a = (story.action || "").trim();
  const r = (story.result || "").trim();

  let sScore = 0;
  let tScore = 0;
  let aScore = 0;
  let rScore = 0;

  let sMsg = "Bitte beschreibe das Projekt, den Kontext oder das Team.";
  if (s.length >= 25) {
    sScore = 25;
    sMsg = "Perfekt formulierter Ausgangskontext.";
  } else if (s.length > 0) {
    sScore = 15;
    sMsg = "Guter Ansatz. Ergänze noch Projekt- oder Kundendetails.";
  }

  let tMsg = "Beschreibe die konkrete Zielstellung oder das Problem.";
  if (t.length >= 25) {
    tScore = 25;
    tMsg = "Aufgabenstellung und Ziel sind glasklar definiert.";
  } else if (t.length > 0) {
    tScore = 15;
    tMsg = "Formuliere präziser, was genau das Kernziel war.";
  }

  let aMsg = "Nutze 'Ich habe...' und nenne konkrete Tools/Entscheidungen.";
  const aLower = a.toLowerCase();
  const hasFirstPerson = aLower.includes("ich ");
  if (a.length >= 35 && hasFirstPerson) {
    aScore = 25;
    aMsg = "Starke Ich-Formulierung mit konkreten Lösungsansätzen.";
  } else if (a.length >= 25) {
    aScore = 20;
    aMsg = "Gut! Verwende noch stärker die Ich-Form ('Ich habe implementiert...').";
  } else if (a.length > 0) {
    aScore = 10;
    aMsg = "Beschreibe die technischen Einzelschritte ausführlicher.";
  }

  let rMsg = "Schließe mit messbarem Erfolg oder Lerneffekt ab.";
  const hasMetric = /\d+|prozent|%|faktor|halbiert|verdoppelt|reduziert/i.test(r);
  if (r.length >= 25 && hasMetric) {
    rScore = 25;
    rMsg = "Hervorragend mit messbarem Resultat und Wirkung!";
  } else if (r.length >= 20) {
    rScore = 18;
    rMsg = "Solides Ergebnis. Ein Zahlenwert (% Ersparnis, Ladezeit) macht es unschlagbar.";
  } else if (r.length > 0) {
    rScore = 10;
    rMsg = "Formuliere das Fazit konkreter.";
  }

  const totalScore = sScore + tScore + aScore + rScore;
  const valid = sScore >= 15 && tScore >= 15 && aScore >= 15 && rScore >= 10;

  return {
    valid,
    score: totalScore,
    feedback: {
      situation: sMsg,
      task: tMsg,
      action: aMsg,
      result: rMsg,
    },
  };
}

export function formatStarStoryForTeleprompter(story: StarStory): string {
  return [
    `STORY: ${story.title.toUpperCase()}`,
    `----------------------------------------`,
    `[S] KONTEXT:`,
    story.situation,
    ``,
    `[T] AUFGABE:`,
    story.task,
    ``,
    `[A] MEINE AKTION:`,
    story.action,
    ``,
    `[R] ERGEBNIS & WIRKUNG:`,
    story.result,
    ...(story.keyTakeaway ? [``, `[TAKEAWAY] FAZIT:`, story.keyTakeaway] : []),
    `----------------------------------------`,
    `Tech-Tags: ${story.techTags.join(", ")}`,
  ].join("\n");
}
