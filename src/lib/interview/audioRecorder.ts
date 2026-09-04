// -----------------------------------------------------------------------------
// Audio-Recorder & Interview-Aufnahme-Helper
// -----------------------------------------------------------------------------
// Bereitet Audio-Blobs auf, formatiert Aufnahmezeiten und generiert visuelle Waveform-Daten.
// -----------------------------------------------------------------------------

export function formatAudioDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function generateMockWaveformBars(barCount: number = 32): number[] {
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    // Erzeugt harmonische Pegel-Höhen zwischen 20% und 100%
    const height = Math.round(20 + Math.sin(i * 0.35) * 35 + Math.cos(i * 0.2) * 25);
    bars.push(Math.max(15, Math.min(100, height)));
  }
  return bars;
}

export type RecordedInterviewAnswer = {
  id: string;
  questionTitle: string;
  durationSeconds: number;
  recordedAt: string;
  blobUrl?: string;
  waveform: number[];
};
