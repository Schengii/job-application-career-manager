// -----------------------------------------------------------------------------
// 60-Sekunden Elevator-Pitch Generator für Vorstellungsgespräche
// -----------------------------------------------------------------------------
// Generiert maßgeschneiderte, prägnante Selbstpräsentationen für die klassische
// Eröffnungsfrage "Erzählen Sie etwas über sich!" (ca. 60-90 Sekunden Sprechzeit).
// -----------------------------------------------------------------------------

export type PitchFocus = "FRONTEND_EXPERT" | "FULLSTACK_AGILE" | "CAREER_CHANGER" | "PERFORMANCE_QUALITY";

export type PitchConfig = {
  focus: PitchFocus;
  targetRole?: string;
  targetCompany?: string;
  experienceYears?: string;
  keyTechnologies?: string[];
  signatureProject?: string;
  careerMotivation?: string;
};

export type GeneratedPitch = {
  hook: string;
  coreStory: string;
  practicalProof: string;
  motivationClosing: string;
  fullPitch: string;
  estimatedSpeechDurationSeconds: number;
  tacticalTips: string[];
};

export const PITCH_FOCUS_PRESETS: Record<
  PitchFocus,
  { label: string; description: string; defaultHook: string }
> = {
  FRONTEND_EXPERT: {
    label: "Frontend & UI/UX Spezialist (React 19 / TS)",
    description: "Fokus auf moderne Web-Architektur, State Management, barrierefreie & performante User Interfaces.",
    defaultHook: "Mein Schwerpunkt liegt auf reaktiven, wartbaren Web-Anwendungen mit React 19, TypeScript und modernem Tailwind CSS.",
  },
  FULLSTACK_AGILE: {
    label: "Fullstack & Pragmatischer Problemlöser",
    description: "Betonung von End-to-End-Verständnis von Next.js API-Routen, Prisma ORM bis hin zum fertigen Frontend.",
    defaultHook: "Ich bewege mich sicher zwischen responsivem Next.js-Frontend und sauberer Backend-Logik mit Prisma und relationalen Datenbanken.",
  },
  CAREER_CHANGER: {
    label: "Fachinformatiker & Praxiserprobter Entwickler",
    description: "Fokus auf fundierte IHK-Ausbildung, agile Arbeitsweise, Code-Qualität und kontinuierliche Lernbereitschaft.",
    defaultHook: "Als ausgebildeter Fachinformatiker für Anwendungsentwicklung verbinde ich saubere Software-Engineering-Prinzipien mit echter Begeisterung für praxistaugliche Softwarelösungen.",
  },
  PERFORMANCE_QUALITY: {
    label: "Code-Qualität, Testing & Performance",
    description: "Besonderer Fokus auf Unit-/E2E-Testing (Vitest, Playwright), CI/CD und blitzschnelle Ladezeiten.",
    defaultHook: "Mir ist besonders wichtig, dass Code nicht nur funktioniert, sondern durch automatisierte Tests stabil abgesichert ist und maximale Performance im Browser liefert.",
  },
};

export function generateElevatorPitch(config: PitchConfig): GeneratedPitch {
  const role = config.targetRole?.trim() || "Frontend Entwickler";
  const company = config.targetCompany?.trim() || "Ihrem Unternehmen";
  const tech = config.keyTechnologies && config.keyTechnologies.length > 0
    ? config.keyTechnologies.slice(0, 4).join(", ")
    : "React, TypeScript, Next.js und Tailwind CSS";
  const project = config.signatureProject?.trim() || "einer vollumfänglichen Karriere- und Bewerbungsmanagement-Plattform";
  const preset = PITCH_FOCUS_PRESETS[config.focus] || PITCH_FOCUS_PRESETS.FRONTEND_EXPERT;

  // 1. Hook
  const hook = `Hallo, vielen Dank für die Einladung! Mein Name ist Entwickler mit klarem Fokus auf moderne Webtechnologien. ${preset.defaultHook}`;

  // 2. Core Story
  const coreStory = `In den letzten Jahren habe ich mich intensiv auf den Tech-Stack rund um ${tech} spezialisiert. Dabei verfolge ich stets den Anspruch, intuitive Benutzeroberflächen mit stabiler Softwarearchitektur, Typsicherheit und Barrierefreiheit zu verbinden.`;

  // 3. Practical Proof
  const practicalProof = `Ein greifbares Beispiel meiner Arbeitsweise ist die Umsetzung von ${project}. Hier habe ich von der Konzeption der Datenmodelle über Performance-Optimierungen bis hin zu umfassenden automatisierten Tests die Verantwortung für saubere Code-Qualität übernommen.`;

  // 4. Motivation & Closing
  const motivationClosing = `Genau diese Begeisterung für durchdachte Frontend-Lösungen und agile Zusammenarbeit möchte ich nun bei ${company} in der Rolle als ${role} einbringen. Ich freue mich sehr auf den gemeinsamen Austausch heute!`;

  const fullPitch = `${hook}\n\n${coreStory}\n\n${practicalProof}\n\n${motivationClosing}`;

  // Durchschn. Sprechgeschwindigkeit: ~130 Wörter pro Minute (~2.15 Wörter/Sekunde)
  const wordCount = fullPitch.split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.round((wordCount / 130) * 60);

  const tacticalTips = [
    "Blickkontakt halten & lächeln: Halte die ersten 2 Sätze flüssig und ohne Zögern.",
    "Pausen gezielt setzen: Mach nach dem Projektbeispiel eine bewusste 1-Sekunden-Atempause.",
    "Zahlen & Fakten erwähnen: Wenn möglich, messbare Erfolge einfließen lassen (z. B. 'über 40 Routen', '100% Testabdeckung').",
    "Ball zurückspielen: Am Ende der Selbstpräsentation signalisieren, dass du offen für gezielte Nachfragen bist.",
  ];

  return {
    hook,
    coreStory,
    practicalProof,
    motivationClosing,
    fullPitch,
    estimatedSpeechDurationSeconds: Math.max(45, estimatedSeconds),
    tacticalTips,
  };
}
