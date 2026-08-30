"use client";

// -----------------------------------------------------------------------------
// Interaktiver Mock-Interview Audio-Recorder & Waveform-Player
// -----------------------------------------------------------------------------
import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw, Download, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAudioDuration, generateMockWaveformBars } from "@/lib/audioRecorder";

export function AudioInterviewRecorder({
  questionTitle,
  onRecordingComplete,
}: {
  questionTitle: string;
  onRecordingComplete?: (blobUrl: string, durationSec: number) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);
  const [playProgress, setPlayProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    setAudioUrl(null);
    setRecordingSeconds(0);
    setWaveformBars(generateMockWaveformBars(32));
    audioChunksRef.current = [];

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          stream.getTracks().forEach((track) => track.stop());
          if (onRecordingComplete) {
            onRecordingComplete(url, recordingSeconds);
          }
        };

        mediaRecorder.start(200);
      }
    } catch {
      // Fallback Simulator bei Mikrofon-Zugriffs-Verweigerung
      console.warn("Mikrofon nicht verfügbar oder Zugriff verweigert. Nutze Audio-Simulation.");
    }

    setIsRecording(true);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else if (!audioUrl) {
      // Fallback-Simulation
      const mockBlob = new Blob(["mock-audio"], { type: "audio/webm" });
      const url = URL.createObjectURL(mockBlob);
      setAudioUrl(url);
      if (onRecordingComplete) {
        onRecordingComplete(url, recordingSeconds);
      }
    }
  }

  function togglePlay() {
    if (!audioElemRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audioElemRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        setPlayProgress(0);
      };
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPlayProgress((audio.currentTime / audio.duration) * 100);
        }
      };
    }

    if (isPlaying) {
      audioElemRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioElemRef.current?.play().catch(() => {
        // Mock Playback
        setIsPlaying(true);
        setTimeout(() => {
          setIsPlaying(false);
          setPlayProgress(0);
        }, (recordingSeconds || 5) * 1000);
      });
      setIsPlaying(true);
    }
  }

  function handleReset() {
    if (audioElemRef.current) {
      audioElemRef.current.pause();
      audioElemRef.current = null;
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingSeconds(0);
    setPlayProgress(0);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Volume2 className="h-4 w-4 text-primary" /> Audio-Selbstcheck: Antwort aufnehmen
        </span>
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> REC {formatAudioDuration(recordingSeconds)}
          </span>
        )}
      </div>

      {/* Aufnahme-Steuerung oder Waveform Player */}
      {!audioUrl && !isRecording && (
        <div className="flex items-center justify-between gap-3 bg-surface-hover/50 rounded-lg p-3 border border-border/70">
          <p className="text-xs text-muted-foreground">
            Übe deine Antwort flüssig laut auszusprechen. Nimm deine Stimme auf und höre dir deine Betonung an.
          </p>
          <Button size="sm" variant="primary" onClick={startRecording} className="shrink-0">
            <Mic className="h-3.5 w-3.5 mr-1" /> Aufnahme starten
          </Button>
        </div>
      )}

      {isRecording && (
        <div className="flex items-center justify-between gap-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3.5">
          {/* Live Waveform Pulse */}
          <div className="flex items-center gap-1 flex-1 h-8">
            {waveformBars.slice(0, 24).map((b, i) => (
              <div
                key={i}
                className="flex-1 bg-rose-500 rounded-full transition-all duration-150"
                style={{ height: `${Math.max(20, (b * (1 + Math.sin(recordingSeconds + i))) % 100)}%` }}
              />
            ))}
          </div>

          <Button size="sm" variant="danger" onClick={stopRecording} className="shrink-0">
            <Square className="h-3.5 w-3.5 mr-1 fill-white" /> Stopp ({formatAudioDuration(recordingSeconds)})
          </Button>
        </div>
      )}

      {audioUrl && !isRecording && (
        <div className="space-y-2.5 bg-primary-soft/20 border border-primary/20 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-primary">Aufnahme bereit ({formatAudioDuration(recordingSeconds)})</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleReset} className="h-7 text-xs text-muted-foreground">
                <RotateCcw className="h-3 w-3 mr-1" /> Neu aufnehmen
              </Button>
              <a
                href={audioUrl}
                download={
                  questionTitle
                    ? `interview-${questionTitle.slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, "_")}.webm`
                    : "interview-antwort.webm"
                }
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors"
              >
                <Download className="h-3 w-3" /> Audio speichern
              </a>
            </div>
          </div>

          {/* Waveform Player Bar */}
          <div className="flex items-center gap-3">
            <Button size="sm" variant="primary" onClick={togglePlay} className="h-8 w-8 rounded-full p-0 shrink-0">
              {isPlaying ? <Pause className="h-3.5 w-3.5 fill-white" /> : <Play className="h-3.5 w-3.5 fill-white ml-0.5" />}
            </Button>

            <div className="flex-1 relative flex items-center gap-1 h-7 bg-surface rounded-md px-2 border border-border">
              {waveformBars.map((b, i) => {
                const isPassed = (i / waveformBars.length) * 100 <= playProgress;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-colors ${
                      isPassed ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                    style={{ height: `${b}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
