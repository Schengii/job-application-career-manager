// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionNoteEditor } from "./question-note-editor";

describe("QuestionNoteEditor", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("lädt gespeicherte Notizen aus dem localStorage und speichert Änderungen ab", () => {
    localStorage.setItem("career_prep_note_q-1", "Meine vorbereitete Antwort");

    render(<QuestionNoteEditor questionId="q-1" />);

    const textarea = screen.getByPlaceholderText(/In meinem Projekt electroCheck-ai/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Meine vorbereitete Antwort");

    fireEvent.change(textarea, { target: { value: "Neue aktualisierte Antwort" } });
    expect(localStorage.getItem("career_prep_note_q-1")).toBe("Neue aktualisierte Antwort");
  });
});
