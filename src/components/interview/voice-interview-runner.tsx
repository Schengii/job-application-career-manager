"use client";

// -----------------------------------------------------------------------------
// Voice-First KI-Interview Simulator (Audio TTS & STT Dialog)
// -----------------------------------------------------------------------------
import { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Award,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import {
  InterviewQuestion,
  INTERVIEW_QUESTIONS,
} from "@/lib/interviewGuide";
import {
  evaluateInterviewAnswer,
  generateFollowUpQuestion,
  AnswerEvaluation,
} from "@/lib/mockInterviewEngine";
import { polishCoverLetterWithAI } from "@/lib/aiService";

interface VoiceInterviewRunnerProps {
  targetJobTitle?: string;
  onFinish?: () => void;
}

export function VoiceInterviewRunner({ targetJobTitle, onFinish }: VoiceInterviewRunnerProps) {
  const toast = useToast();

  // 5 Fragen für den Durchlauf auswählen
  const [questions] = useState<InterviewQuestion[]>(() => {
    const pool = [...INTERVIEW_QUESTIONS];
    return pool.sort(() => 0.5 - Math.random()).slice(0, 5);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Folgefrage-Zustand
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");

  // Ergebnisse
  const [evaluations, setEvaluations] = useState<AnswerEvaluation[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const recognitionRef = useRef<any>(null);

  const currentQuestion = questions[currentIndex];

  // Vorlesen via Web Speech API (TTS)
  function speakText(text: string) {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  // Frage vorlesen, wenn Index wechselt
  useEffect(() => {
    if (!isFinished && currentQuestion) {
      speakText(currentQuestion.question);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentIndex, isFinished]);

  // STT: Spracheingabe initialisieren
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true;
        reco.interimResults = true;
        reco.lang = "de-DE";

        reco.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (followUp) {
            setFollowUpAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
          } else {
            setUserAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        reco.onerror = () => setIsRecording(false);
        reco.onend = () => setIsRecording(false);

        recognitionRef.current = reco;
      }
    }
  }, [followUp]);

  function toggleRecording() {
    if (!recognitionRef.current) {
      toast.error("Spracherkennung wird in diesem Browser nicht unterstützt. Bitte tippe deine Antwort ein.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Sprachaufnahme aktiv. Sprich frei ins Mikrofon …");
      } catch {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    }
  }

  function handleTriggerFollowUp() {
    if (!userAnswer.trim()) {
      toast.warning("Bitte gib zuerst deine Hauptantwort ein.");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    const generated = generateFollowUpQuestion(currentQuestion, userAnswer);
    setFollowUp(generated);
    speakText(`Gute Antwort. Eine kurze Nachfrage dazu: ${generated}`);
  }

  function handleNextQuestion() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const fullCombinedAnswer = `${userAnswer} ${followUpAnswer}`.trim();
    const evaluation = evaluateInterviewAnswer(currentQuestion, fullCombinedAnswer);
    const updatedEvals = [...evaluations, evaluation];
    setEvaluations(updatedEvals);

    setUserAnswer("");
    setFollowUp(null);
    setFollowUpAnswer("");

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      toast.success("Mock-Interview erfolgreich abgeschlossen!");
    }
  }

  const averageScore =
    evaluations.length > 0
      ? Math.round(evaluations.reduce((acc, curr) => acc + curr.score, 0) / evaluations.length)
      : 0;

  if (isFinished) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface p-6 text-center shadow-md">
          <Award className="h-12 w-12 text-primary mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-foreground">Interview-Auswertung</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gesamtergebnis über alle 5 Fach- & Verhaltensfragen
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-lg font-bold text-white shadow-sm">
            Gesamt-Score: {averageScore}%
          </div>
        </div>

        {/* Einzelne Fragen-Reports */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const ev = evaluations[idx];
            if (!ev) return null;
            return (
              <div key={q.id} className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-primary">Frage {idx + 1} von 5</span>
                    <h4 className="text-sm font-semibold text-foreground">{q.question}</h4>
                  </div>
                  <span className="rounded-md bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary shrink-0">
                    {ev.score}% ({ev.rating})
                  </span>
                </div>

                <div className="text-xs space-y-1 pt-2 border-t border-border/60">
                  {ev.feedback.map((f, i) => (
                    <p key={i} className="text-muted-foreground flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {f}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentIndex(0);
              setUserAnswer("");
              setFollowUp(null);
              setFollowUpAnswer("");
              setEvaluations([]);
              setIsFinished(false);
            }}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" /> Neuer Durchlauf
          </Button>
          {onFinish && (
            <Button onClick={onFinish}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Abschließen
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question Header & Voice Speaker */}
      <div className="rounded-2xl border border-primary/30 bg-surface p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Frage {currentIndex + 1} von {questions.length} • {currentQuestion.category}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? "Sprachausgabe stummschalten" : "Sprachausgabe aktivieren"}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => speakText(currentQuestion.question)}
              title="Frage nochmals vorlesen"
            >
              <Play className="h-3.5 w-3.5 mr-1 text-primary" /> Frage vorlesen
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md ${isSpeaking ? "animate-pulse" : ""}`}>
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground leading-snug">
              {currentQuestion.question}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Schwerpunkt: {currentQuestion.keywords.join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Answer Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">
            Deine Antwort (Frei einsprechen oder eintippen)
          </label>
          <Button
            size="sm"
            variant={isRecording ? "danger" : "outline"}
            onClick={toggleRecording}
            className="animate-fade-in"
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4 mr-1.5 animate-pulse text-red-500" /> Aufnahme stoppen
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-1.5 text-primary" /> Per Sprache antworten 🎙️
              </>
            )}
          </Button>
        </div>

        <Textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          rows={5}
          placeholder="Sprich oder schreibe deine Antwort strukturiert (Situation, Aktion, Ergebnis / STAR-Prinzip) …"
        />

        {/* Optional Follow-Up Question Section */}
        {followUp ? (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10 p-4 space-y-2 animate-scale-in">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Dynamische Folgefrage des Interviewers:
            </span>
            <p className="text-sm font-semibold text-foreground">{followUp}</p>
            <Textarea
              value={followUpAnswer}
              onChange={(e) => setFollowUpAnswer(e.target.value)}
              rows={3}
              placeholder="Antwort auf die Vertiefungsfrage …"
              className="mt-2"
            />
          </div>
        ) : (
          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTriggerFollowUp}
              disabled={!userAnswer.trim() || isRecording}
              className="text-xs text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Folgefrage vom Interviewer anfordern
            </Button>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Tipp: Erwähne konkrete Praxisbeispiele (z. B. <em>electroCheck-ai</em> oder Komponenten-Architektur).
        </span>
        <Button onClick={handleNextQuestion} disabled={!userAnswer.trim()}>
          {currentIndex + 1 < questions.length ? (
            <>
              Nächste Frage <ArrowRight className="h-4 w-4 ml-1.5" />
            </>
          ) : (
            <>
              Auswertung anzeigen <Award className="h-4 w-4 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
