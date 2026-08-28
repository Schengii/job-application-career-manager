// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AudioInterviewRecorder } from "./audio-interview-recorder";

describe("AudioInterviewRecorder", () => {
  it("rendert den Start-Button und wechselt in den Aufnahme-Zustand", async () => {
    vi.useFakeTimers();

    render(
      <AudioInterviewRecorder questionTitle="Erzählen Sie von Ihrem Werdegang" />
    );

    const startBtn = screen.getByText("Aufnahme starten");
    expect(startBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(startBtn);
    });

    expect(screen.getByText(/Stopp/i)).toBeDefined();

    // Simuliere 3 Sekunden Aufnahme
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    const stopBtn = screen.getByText(/Stopp/i);
    await act(async () => {
      fireEvent.click(stopBtn);
    });

    expect(screen.getByText(/Aufnahme bereit/i)).toBeDefined();

    vi.useRealTimers();
  });
});
