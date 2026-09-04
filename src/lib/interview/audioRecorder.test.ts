import { describe, it, expect } from "vitest";
import {
  formatAudioDuration,
  generateMockWaveformBars,
} from "@/lib/interview/audioRecorder";

describe("audioRecorder", () => {
  it("formatiert Sekunden korrekt in mm:ss", () => {
    expect(formatAudioDuration(0)).toBe("00:00");
    expect(formatAudioDuration(65)).toBe("01:05");
    expect(formatAudioDuration(600)).toBe("10:00");
  });

  it("generiert valide Waveform-Balken im Bereich von 15 bis 100", () => {
    const bars = generateMockWaveformBars(32);
    expect(bars.length).toBe(32);
    for (const b of bars) {
      expect(b).toBeGreaterThanOrEqual(15);
      expect(b).toBeLessThanOrEqual(100);
    }
  });
});
