"use client";

import { useState } from "react";
import { Mic, MicOff, Sparkles, ThumbsUp, AlertCircle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  analyzeInterviewNotes,
  type InterviewFeedbackInsight,
} from "@/lib/interview/interviewAudioFeedback";

interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
}
type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export function InterviewFeedbackCard() {
  const toast = useToast();
  const [notes, setNotes] = useState(
    "Sehr freundliches Gespräch mit dem Teamleiter und Senior Frontend Developer. Guter Eindruck, Team passt menschlich super. Wir sprachen ausführlich über React, TypeScript und Clean Code. Kleine Lücke bei Docker-Deployment, sonst sehr souverän."
  );
  const [isRecording, setIsRecording] = useState(false);
  const [analysis, setAnalysis] = useState<InterviewFeedbackInsight>(() =>
    analyzeInterviewNotes(
      "Sehr freundliches Gespräch mit dem Teamleiter und Senior Frontend Developer. Guter Eindruck, Team passt menschlich super. Wir sprachen ausführlich über React, TypeScript und Clean Code. Kleine Lücke bei Docker-Deployment, sonst sehr souverän."
    )
  );

  function handleAnalyze() {
    setAnalysis(analyzeInterviewNotes(notes));
    toast.success("Gesprächsnotizen analysiert!");
  }

  function toggleDictate() {
    if (typeof window === "undefined") return;

    const win = window as unknown as WindowWithSpeechRecognition;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error("Spracherkennung wird in diesem Browser leider nicht unterstützt.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "de-DE";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info("Sprachaufnahme aktiv: Bitte sprich jetzt...");
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results[0][0].transcript;
        setNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast.error("Sprachaufnahme abgebrochen.");
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      toast.error("Konnte Mikrofon nicht aktivieren.");
    }
  }

  return (
    <Card className="border border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Post-Interview Transkript & Feedback-Audit (Voice Memo)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Diktierte Sprachnotizen oder Memos direkt nach dem Vorstellungsgespräch analysieren: Stärken, Lücken & Follow-up-Taktik.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleDictate}
            className={`h-8 text-xs ${isRecording ? "bg-rose-500/15 border-rose-500 text-rose-600 animate-pulse" : ""}`}
          >
            {isRecording ? <MicOff className="h-3.5 w-3.5 mr-1" /> : <Mic className="h-3.5 w-3.5 mr-1" />}
            {isRecording ? "Aufnahme stoppen" : "Sprachmemo diktieren"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Erfasse deine Eindrücke direkt nach dem Gespräch..."
            className="text-xs"
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={handleAnalyze} className="h-7 text-xs">
              Audit durchführen
            </Button>
          </div>
        </div>

        {/* Structured Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Readiness & Sentiment */}
          <div className="p-3.5 rounded-lg border border-border/60 bg-surface-hover/30 space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Erfolgs-Indikator
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{analysis.readinessScore}%</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  analysis.sentiment === "VERY_POSITIVE" || analysis.sentiment === "POSITIVE"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                {analysis.sentiment}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              {analysis.followUpAdvice}
            </p>
          </div>

          {/* Stärken */}
          <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" /> Positive Signale
            </span>
            {analysis.strengths.length === 0 ? (
              <span className="text-xs text-muted-foreground block">Keine expliziten Signale erkannt</span>
            ) : (
              <ul className="text-xs space-y-1 text-foreground">
                {analysis.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Lücken / Einwände */}
          <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1.5">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> Knackpunkte & Lücken
            </span>
            {analysis.weaknesses.length === 0 ? (
              <span className="text-xs text-muted-foreground block">Keine Unsicherheiten festgestellt 👍</span>
            ) : (
              <ul className="text-xs space-y-1 text-foreground">
                {analysis.weaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Besprochene Tech-Themen */}
        {analysis.discussedTopics.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> Besprochene Tech-Stacks:
            </span>
            {analysis.discussedTopics.map((t, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[10px]">
                #{t}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
