"use client";

// -----------------------------------------------------------------------------
// Interaktives Mock-Interview Modal
// -----------------------------------------------------------------------------
import { useState } from "react";
import {
  Sparkles,
  Trophy,
  X,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { InterviewQuestion } from "@/lib/interviewGuide";
import { evaluateInterviewAnswer, AnswerEvaluation } from "@/lib/mockInterviewEngine";

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
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [history, setHistory] = useState<{ question: InterviewQuestion; evaluation: AnswerEvaluation }[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  if (!open) return null;

  const currentQ = selectedQuestions[currentIndex];

  function handleEvaluate() {
    if (!currentQ || !userAnswer.trim()) return;
    const result = evaluateInterviewAnswer(currentQ, userAnswer);
    setEvaluation(result);
    setHistory((prev) => [...prev, { question: currentQ, evaluation: result }]);
  }

  function handleNext() {
    if (currentIndex + 1 < selectedQuestions.length) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer("");
      setEvaluation(null);
    } else {
      setIsFinished(true);
    }
  }

  function handleRestart() {
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
                  <label className="text-xs font-medium text-muted-foreground">
                    Deine Antwort (tippe deine Erklärung wie im echten Gespräch):
                  </label>
                  <Textarea
                    rows={6}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Erkläre die Kernkonzepte, nenne konkrete Praxisbeispiele oder Methoden …"
                    className="mt-1 text-sm leading-relaxed"
                  />
                </div>
              ) : (
                /* Auswertungs-Ansicht */
                <div className="rounded-lg border border-border p-4 bg-surface-hover/30 space-y-3 text-xs leading-relaxed">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      {evaluation.score >= 70 ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-warning" />
                      )}
                      Ergebnis: {evaluation.rating}
                    </span>
                    <span className="rounded-full bg-primary px-2.5 py-1 font-bold text-white text-xs">
                      {evaluation.score} / 100 Punkte
                    </span>
                  </div>

                  <div className="space-y-1 text-muted-foreground">
                    {evaluation.feedback.map((fb, idx) => (
                      <p key={idx}>• {fb}</p>
                    ))}
                  </div>

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
              <Button size="sm" onClick={handleEvaluate} disabled={!userAnswer.trim()}>
                <Sparkles className="h-4 w-4" /> Antwort auswerten & Feedback erhalten
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
