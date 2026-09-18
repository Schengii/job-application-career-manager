// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { VoiceInterviewRunner } from "./voice-interview-runner";

describe("VoiceInterviewRunner", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rendert die erste Frage und Eingabefelder korrekt", () => {
    render(<VoiceInterviewRunner targetJobTitle="Frontend Developer" />);

    expect(screen.getByText(/Frage 1 von 5/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Sprich oder schreibe deine Antwort/i)).toBeDefined();
    expect(screen.getByText(/KI-Nachfrage vom Interviewer anfordern/i)).toBeDefined();
  });

  it("fordert eine KI-Nachfrage an und zeigt diese im DOM an", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        followUp: "Wie hast du bei der State-Verwaltung Re-Renders minimiert?",
        usedAi: true,
        modelUsed: "gpt-4o-mini",
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<VoiceInterviewRunner targetJobTitle="React Specialist" />);

    const textarea = screen.getByPlaceholderText(/Sprich oder schreibe deine Antwort/i);
    fireEvent.change(textarea, {
      target: { value: "Ich habe ein modulares React 19 Frontend mit Server Components gebaut." },
    });

    const followUpBtn = screen.getByText(/KI-Nachfrage vom Interviewer anfordern/i);
    await act(async () => {
      fireEvent.click(followUpBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Dynamische KI-Nachfrage des Interviewers:/i)).toBeDefined();
      expect(
        screen.getByText("Wie hast du bei der State-Verwaltung Re-Renders minimiert?")
      ).toBeDefined();
    });

    expect(screen.getByText("gpt-4o-mini")).toBeDefined();
  });
});
