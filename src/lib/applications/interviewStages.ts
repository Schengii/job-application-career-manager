// -----------------------------------------------------------------------------
// Interview Stage Pipeline Definition & Helper
// -----------------------------------------------------------------------------

export interface InterviewStageDefinition {
  id: string;
  label: string;
  order: number;
  description: string;
  typicalDuration: string;
}

export const INTERVIEW_PIPELINE_STAGES: InterviewStageDefinition[] = [
  {
    id: "SCREENING",
    label: "1. Erstgespräch / HR Screening",
    order: 1,
    description: "Kennenlernen, Rahmenbedingungen, Gehaltsvorstellung & Motivation",
    typicalDuration: "20-30 Min.",
  },
  {
    id: "CODING_CHALLENGE",
    label: "2. Coding Challenge / Take-Home",
    order: 2,
    description: "Praktische Code-Aufgabe, Refactoring oder Online-Quiz",
    typicalDuration: "2-4 Std. / 3 Tage Frist",
  },
  {
    id: "TECH_INTERVIEW",
    label: "3. Tech Deep Dive & Architektur",
    order: 3,
    description: "Fachgespräch mit Lead Developer / Team, Live-Code-Review",
    typicalDuration: "60-90 Min.",
  },
  {
    id: "FINAL_ROUND",
    label: "4. Finales Gespräch / Culture Fit",
    order: 4,
    description: "Gespräch mit Geschäftsführung / Abteilungsleitung & Team-Fit",
    typicalDuration: "45-60 Min.",
  },
  {
    id: "OFFER_STAGE",
    label: "5. Angebot & Vertragsabschluss",
    order: 5,
    description: "Vertragsangebot liegt vor, Konditionsverhandlung",
    typicalDuration: "1-2 Wochen",
  },
];

export function getStageOrder(stageId: string | null | undefined): number {
  if (!stageId) return 0;
  const stage = INTERVIEW_PIPELINE_STAGES.find((s) => s.id === stageId);
  return stage ? stage.order : 0;
}
