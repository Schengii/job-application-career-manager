// -----------------------------------------------------------------------------
// Speicher- & Verwaltungslogik für eigene Interview-Fragen
// -----------------------------------------------------------------------------
import type { InterviewQuestion } from "./interviewGuide";

export const CUSTOM_QUESTIONS_STORAGE_KEY = "career_manager_custom_questions_v1";

export function loadCustomQuestions(): InterviewQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_QUESTIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InterviewQuestion[];
  } catch {
    return [];
  }
}

export function saveCustomQuestion(question: Omit<InterviewQuestion, "id"> & { id?: string }): InterviewQuestion {
  const existing = loadCustomQuestions();
  const id = question.id || `custom-${Date.now()}`;
  const newItem: InterviewQuestion = {
    ...question,
    id,
  };

  const updated = existing.some((q) => q.id === id)
    ? existing.map((q) => (q.id === id ? newItem : q))
    : [newItem, ...existing];

  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(updated));
  }
  return newItem;
}

export function deleteCustomQuestion(id: string): void {
  const existing = loadCustomQuestions();
  const filtered = existing.filter((q) => q.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(filtered));
  }
}
