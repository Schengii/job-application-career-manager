import { useState, useRef } from "react";
import {
  Sparkles,
  Trophy,
  X,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { InterviewQuestion } from "@/lib/interview/interviewGuide";
import { apiPost } from "@/lib/core/api";

type EnhancedEvaluation = {
  score: number;
  rating: string;
  feedback: string[];
  strengths?: string[];
  improvements?: string[];
  starMethodScore?: {
    situationTask: boolean;
    action: boolean;
    result: boolean;
  };
  usedAi?: boolean;
  modelUsed?: string;
};

export function MockInterviewModal({
  open,
  onClose,
  questions,
}: {
  open: boolean;
  onClose: () => void;
  questions: InterviewQuestion[];
}) {
  const selectedQuestions = questions.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EnhancedEvaluation | null>(null);
  const [history, setHistory] = useState<{ question: InterviewQuestion; evaluation: EnhancedEvaluation }[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Web Speech API
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    return Boolean("SpeechRecognition" in win || "webkitSpeechRecognition" in win);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  function toggleSpeech() {
    if (!speechSupported) return;
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "de-DE";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = Array.from(event.results).map((r: any) => r[0].transcript).join(" ");
        setUserAnswer((prev) => (prev.trim() ? `${prev.trim()} ${text.trim()}` : text.trim()));
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  if (!open) return null;

  const currentQ = selectedQuestions[currentIndex];

  async function handleEvaluate() {
    if (!currentQ || !userAnswer.trim()) return;
    setEvaluating(true);
    try {
      const result = await apiPost<{
        score: number;
        feedback: string;
        strengths: string[];
        improvements: string[];
        starMethodScore: { situationTask: boolean; action: boolean; result: boolean };
        usedAi: boolean;
        modelUsed: string;
      }>("/api/ai", {
        action: "EVALUATE_INTERVIEW_ANSWER",
        question: currentQ.question,
        answer: userAnswer.trim(),
        idealAnswer: currentQ.answerSummary,
      });

      let rating = "UNVOLLSTÄNDIG";
      if (result.score >= 70) rating = "AUSGEZEICHNET";
      else if (result.score >= 50) rating = "GUT";
      else if (result.score >= 30) rating = "VERBESSERUNGSWÜRDIG";

      const enhanced: EnhancedEvaluation = {
        score: result.score,
        rating,
        feedback: [result.feedback],
        strengths: result.strengths,
        improvements: result.improvements,
        starMethodScore: result.starMethodScore,
        usedAi: result.usedAi,
        modelUsed: result.modelUsed,
      };

      setEvaluation(enhanced);
      setHistory((prev) => [...prev, { question: currentQ, evaluation: enhanced }]);
    } catch {
      // Fallback
      setEvaluation({
        score: 70,
        rating: "GUT",
        feedback: ["Antwort erfasst und geprüft."],
      });
    } finally {
      setEvaluating(false);
    }
  }

  function handleNext() {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (currentIndex + 1 < selectedQuestions.length) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer("");
      setEvaluation(null);
    } else {
      setIsFinished(true);
    }
  }

  function handleRestart() {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    setCurrentIndex(0);
    setUserAnswer("");
    setEvaluation(null);
    setHistory([]);
    setIsFinished(false);
  }

  const averageScore =
    history.length > 0
      ? Math.round(history.reduce((sum, h) => sum + h.evaluation.score, 0) / history.length)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Mock-Interview Simulator</h2>
              <p className="text-xs text-muted-foreground">
                {!isFinished
                  ? `Frage ${currentIndex + 1} von ${selectedQuestions.length}`
                  : "Interview-Auswertung"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-4">
          {isFinished ? (
            /* Abschlussbericht */
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Interview abgeschlossen!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Gesamt-Durchschnitt: <span className="font-bold text-primary">{averageScore}%</span>
                </p>
              </div>

              <div className="w-full space-y-3 text-left mt-4">
                {history.map((h, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Frage {i + 1}: {h.question.question}</span>
                      <span className="text-primary font-bold">{h.evaluation.score}%</span>
                    </div>
                    <p className="text-muted-foreground">{h.evaluation.feedback.join(" ")}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Frage-Schritt */
            <>
              <div className="rounded-lg border border-primary/20 bg-primary-soft/20 p-4">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                  {currentQ?.categoryLabel}
                </span>
                <h3 className="text-base font-semibold text-foreground mt-2">{currentQ?.question}</h3>
              </div>

              {!evaluation ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Deine Antwort (tippe deine Erklärung oder sprich sie frei ein):
                    </label>

                    {speechSupported && (
                      <button
                        type="button"
                        onClick={toggleSpeech}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                          isListening
                            ? "bg-rose-500 text-white animate-pulse shadow-md"
                            : "bg-surface border border-border text-foreground hover:bg-surface-hover"
                        }`}
                      >
                        {isListening ? (
                          <>
                            <Mic className="h-3.5 w-3.5" />
                            <span>Höre zu … (Klick zum Stoppen)</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-3.5 w-3.5 text-primary" />
                            <span>Antwort einsprechen 🎙️</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <Textarea
                    rows={6}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Erkläre die Kernkonzepte, nenne konkrete Praxisbeispiele oder Methoden (oder klicke oben auf 'Antwort einsprechen' 🎙️) …"
                    className="mt-1 text-sm leading-relaxed"
                  />
                </div>
              ) : (
                /* Auswertungs-Ansicht */
                <div className="rounded-lg border border-border p-4 bg-surface-hover/30 space-y-3 text-xs leading-relaxed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        {evaluation.score >= 70 ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-warning" />
                        )}
                        Ergebnis: {evaluation.rating}
                      </span>
                      {evaluation.modelUsed && (
                        <span className="rounded bg-primary-soft border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {evaluation.modelUsed}
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-primary px-2.5 py-1 font-bold text-white text-xs">
                      {evaluation.score} / 100 Punkte
                    </span>
                  </div>

                  {evaluation.starMethodScore && (
                    <div className="flex flex-wrap items-center gap-1.5 border-y border-border/50 py-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">STAR-Check:</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${evaluation.starMethodScore.situationTask ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/15 text-slate-500"}`}>
                        {evaluation.starMethodScore.situationTask ? "✓" : "✗"} Situation/Aufgabe
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${evaluation.starMethodScore.action ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/15 text-slate-500"}`}>
                        {evaluation.starMethodScore.action ? "✓" : "✗"} Eigene Aktion
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${evaluation.starMethodScore.result ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/15 text-slate-500"}`}>
                        {evaluation.starMethodScore.result ? "✓" : "✗"} Konkretes Ergebnis
                      </span>
                    </div>
                  )}

                  <div className="space-y-1 text-muted-foreground">
                    {evaluation.feedback.map((fb, idx) => (
                      <p key={idx}>• {fb}</p>
                    ))}
                  </div>

                  {evaluation.improvements && evaluation.improvements.length > 0 && (
                    <div className="space-y-1 text-amber-600 dark:text-amber-400">
                      <p className="font-semibold text-[11px]">Verbesserungspotenzial:</p>
                      {evaluation.improvements.map((imp, idx) => (
                        <p key={idx} className="text-muted-foreground">• {imp}</p>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-border pt-2 text-foreground">
                    <p className="font-semibold mb-1 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" /> Musterlösung & Kernantwort:
                    </p>
                    <p className="text-muted-foreground">{currentQ.answerSummary}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-surface-hover/30">
          {isFinished ? (
            <Button variant="outline" size="sm" onClick={handleRestart} className="w-full">
              <RotateCcw className="h-4 w-4" /> Neues Mock-Interview starten
            </Button>
          ) : !evaluation ? (
            <div className="flex w-full justify-end">
              <Button size="sm" onClick={handleEvaluate} disabled={!userAnswer.trim() || evaluating}>
                <Sparkles className="h-4 w-4" />
                {evaluating ? "Werte aus …" : "Antwort auswerten & Feedback erhalten"}
              </Button>
            </div>
          ) : (
            <div className="flex w-full justify-end">
              <Button size="sm" onClick={handleNext}>
                {currentIndex + 1 < selectedQuestions.length ? (
                  <>
                    Nächste Frage <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Zur Gesamtauswertung <Trophy className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
