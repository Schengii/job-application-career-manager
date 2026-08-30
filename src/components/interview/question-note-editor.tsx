"use client";

// -----------------------------------------------------------------------------
// Persönliche Antwort-Notizen & Sprach-Diktat (STT) für Leitfaden-Fragen
// -----------------------------------------------------------------------------
import { useState, useRef } from "react";
import { Mic, MicOff, CheckCircle2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
};

export function QuestionNoteEditor({
  questionId,
  onNoteChange,
}: {
  questionId: string;
  onNoteChange?: (note: string) => void;
}) {
  const toast = useToast();
  const storageKey = `career_prep_note_${questionId}`;

  const [note, setNote] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(`career_prep_note_${questionId}`) || "";
    } catch {
      return "";
    }
  });
  const [isListening, setIsListening] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);
  if (storageKey !== prevStorageKey) {
    setPrevStorageKey(storageKey);
    let saved = "";
    try {
      saved = (typeof window !== "undefined" ? localStorage.getItem(storageKey) : null) || "";
    } catch {}
    setNote(saved);
    if (onNoteChange && saved) {
      onNoteChange(saved);
    }
  }

  function handleSave(textToSave: string) {
    try {
      localStorage.setItem(storageKey, textToSave);
      setIsSaved(true);
      if (onNoteChange) onNoteChange(textToSave);
      setTimeout(() => setIsSaved(false), 2000);
    } catch {}
  }

  function handleTextChange(val: string) {
    setNote(val);
    handleSave(val);
  }

  function toggleSpeechRecognition() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const SpeechRecognitionClass =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error("Spracherkennung wird in diesem Browser leider nicht unterstützt (Empfehlung: Chrome/Edge).");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "de-DE";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + " ";
          }
        }
        if (transcript.trim()) {
          setNote((prev) => {
            const updated = prev ? `${prev} ${transcript.trim()}` : transcript.trim();
            handleSave(updated);
            return updated;
          });
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      toast.success("Sprachaufnahme aktiv – sprich deine Antwort ein 🎙️");
    } catch {
      setIsListening(false);
      toast.error("Mikrofon konnte nicht aktiviert werden.");
    }
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-surface p-3 space-y-2 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <Edit3 className="h-3.5 w-3.5" /> Meine persönliche Antwort / Notiz:
        </span>
        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Gespeichert
            </span>
          )}
          <Button
            type="button"
            size="sm"
            variant={isListening ? "danger" : "outline"}
            onClick={toggleSpeechRecognition}
            className="h-6 px-2 text-[10px]"
            title={isListening ? "Aufnahme stoppen" : "Antwort per Sprache diktieren"}
          >
            {isListening ? (
              <>
                <MicOff className="h-3 w-3 mr-1 animate-pulse" /> Stoppen …
              </>
            ) : (
              <>
                <Mic className="h-3 w-3 mr-1 text-primary" /> Diktieren 🎙️
              </>
            )}
          </Button>
        </div>
      </div>

      <textarea
        value={note}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="z. B. 'In meinem Projekt electroCheck-ai habe ich dafür einen Custom Hook geschrieben, der...'"
        rows={3}
        className="w-full rounded-md border border-border bg-surface-hover/30 p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
      />
    </div>
  );
}
