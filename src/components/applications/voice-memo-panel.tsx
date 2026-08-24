"use client";

// -----------------------------------------------------------------------------
// Audio-Notizen & Sprachmemo-Recorder für Vorstellungsgespräche
// -----------------------------------------------------------------------------
import { useState, useRef } from "react";
import { Mic, Square, Play, Pause, Trash2, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export interface VoiceMemo {
  id: string;
  applicationId: string;
  title: string;
  audioData: string; // Base64 Data URL
  durationSeconds: number;
  createdAt: string;
  notes?: string;
}

export function VoiceMemoPanel({ applicationId, companyName }: { applicationId: string; companyName: string }) {
  const toast = useToast();
  const storageKey = `career_memos_${applicationId}`;

  const [memos, setMemos] = useState<VoiceMemo[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [newMemoTitle, setNewMemoTitle] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  function saveMemos(updated: VoiceMemo[]) {
    setMemos(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      toast.error("Speicherplatz für Audio-Memos voll.");
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const newMemo: VoiceMemo = {
            id: `memo-${Date.now()}`,
            applicationId,
            title: newMemoTitle.trim() || `Interview-Eindrücke (${companyName})`,
            audioData: base64Audio,
            durationSeconds: recordDuration,
            createdAt: new Date().toISOString(),
          };
          saveMemos([newMemo, ...memos]);
          setNewMemoTitle("");
          toast.success("Sprachmemo erfolgreich gespeichert!");
        };
        // Stoppe alle Audio-Tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Mikrofon-Zugriff verweigert oder nicht verfügbar.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function togglePlay(memo: VoiceMemo) {
    if (playingId === memo.id) {
      audioPlayerRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = memo.audioData;
        audioPlayerRef.current.play();
        setPlayingId(memo.id);
        audioPlayerRef.current.onended = () => setPlayingId(null);
      }
    }
  }

  function handleDelete(id: string) {
    if (playingId === id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingId(null);
    }
    const updated = memos.filter((m) => m.id !== id);
    saveMemos(updated);
    toast.success("Sprachmemo gelöscht.");
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Audio-Notizen & Sprachmemos</CardTitle>
            <p className="text-xs text-muted-foreground">
              Schnelle Audio-Notizen nach Telefonaten & Vorstellungsgesprächen
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hidden Audio Element */}
        <audio ref={audioPlayerRef} className="hidden" />

        {/* Recorder Box */}
        <div className="rounded-xl border border-border bg-surface-hover/30 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Titel des Memos (z. B. Feedback Erstgespräch Tech Lead) …"
              value={newMemoTitle}
              onChange={(e) => setNewMemoTitle(e.target.value)}
              disabled={isRecording}
              className="flex-1 min-w-[200px] rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {!isRecording ? (
              <Button size="sm" onClick={startRecording} className="card-hover-effect">
                <Mic className="h-4 w-4 text-white" />
                <span>Aufnahme starten</span>
              </Button>
            ) : (
              <Button size="sm" variant="danger" onClick={stopRecording} className="animate-pulse">
                <Square className="h-4 w-4 fill-current" />
                <span>Stoppen ({formatTime(recordDuration)})</span>
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 animate-pulse-subtle">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500" />
              Mikrofon nimmt auf … {formatTime(recordDuration)}
            </div>
          )}
        </div>

        {/* Memos Liste */}
        <div className="space-y-2">
          {memos.length === 0 && !isRecording && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Noch keine Audio-Notizen aufgenommen. Klicke auf „Aufnahme starten“, um dein erstes Sprachmemo zu hinterlegen.
            </p>
          )}

          {memos.map((memo) => {
            const isPlaying = playingId === memo.id;
            return (
              <div
                key={memo.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-hover/50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => togglePlay(memo)}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isPlaying
                        ? "bg-primary text-white"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{memo.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatTime(memo.durationSeconds || 0)}
                      </span>
                      <span>
                        {new Date(memo.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={memo.audioData}
                    download={`${memo.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.webm`}
                    className="rounded p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                    title="Audio herunterladen"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(memo.id)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                    title="Memo löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
