"use client";

// -----------------------------------------------------------------------------
// Tech & Coding-Challenge Quiz Simulator (React 19 / TypeScript 5+ / Next.js)
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import {
  Code2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TECH_QUIZ_QUESTIONS,
  TechQuizCategory,
  TechQuizQuestion,
  evaluateQuizSession,
  getQuestionsBySkills,
} from "@/lib/techQuizEngine";

const CATEGORIES: { id: "ALL" | TechQuizCategory; label: string }[] = [
  { id: "ALL", label: "Alle Fachgebiete (Mix)" },
  { id: "REACT_NEXT", label: "React 19 & Next.js" },
  { id: "TYPESCRIPT", label: "TypeScript 5+" },
  { id: "PERF_CSS_ARCH", label: "Web Performance & Arch" },
];

interface TechQuizSimulatorProps {
  /** Optional: Wenn gesetzt, startet das Quiz gefiltert auf diese Skills
   * (z. B. aus der Skill-Gap-Matrix), statt auf ein Fachgebiet. */
  initialSkillFocus?: string[];
}

export function TechQuizSimulator({ initialSkillFocus }: TechQuizSimulatorProps = {}) {
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | TechQuizCategory>("ALL");
  const [skillFocus, setSkillFocus] = useState<string[] | null>(
    initialSkillFocus && initialSkillFocus.length > 0 ? initialSkillFocus : null
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  const filteredQuestions = useMemo(() => {
    if (skillFocus && skillFocus.length > 0) {
      const bySkill = getQuestionsBySkills(skillFocus);
      if (bySkill.length > 0) return bySkill;
    }
    if (selectedCategory === "ALL") return TECH_QUIZ_QUESTIONS;
    return TECH_QUIZ_QUESTIONS.filter((q) => q.category === selectedCategory);
  }, [selectedCategory, skillFocus]);

  function clearSkillFocus() {
    setSkillFocus(null);
    setAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
  }

  const currentQ: TechQuizQuestion | undefined = filteredQuestions[currentIndex];
  const hasAnsweredCurrent = currentQ ? answers[currentQ.id] !== undefined : false;
  const currentSelectedOption = currentQ ? answers[currentQ.id] : undefined;

  function handleSelectOption(optionIndex: number) {
    if (hasAnsweredCurrent || !currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionIndex }));
  }

  function handleNext() {
    if (currentIndex + 1 < filteredQuestions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  }

  function handleRestart() {
    setAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
  }

  const evaluation = useMemo(() => {
    return evaluateQuizSession(answers, filteredQuestions);
  }, [answers, filteredQuestions]);

  const progressPct = filteredQuestions.length > 0
    ? Math.round(((currentIndex + (hasAnsweredCurrent ? 1 : 0)) / filteredQuestions.length) * 100)
    : 0;

  if (isFinished) {
    return (
      <Card className="border-primary/30 bg-surface shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Award className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Tech-Assessment abgeschlossen!
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Dein Ergebnis für {selectedCategory === "ALL" ? "den gesamten Fach-Katalog" : CATEGORIES.find(c => c.id === selectedCategory)?.label}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {/* Score Badge */}
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-surface-hover/50 p-6 border border-border">
            <span className="text-4xl font-extrabold text-primary">
              {evaluation.scorePct}%
            </span>
            <span className="text-xs font-semibold text-foreground">
              {evaluation.correctAnswers} von {evaluation.totalQuestions} Fragen richtig
            </span>
            <p className="text-xs text-muted-foreground text-center max-w-md mt-2">
              {evaluation.feedbackSummary}
            </p>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ergebnis nach Fachbereich:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(evaluation.categoryBreakdown).map(([cat, stats]) => {
                const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return (
                  <div key={cat} className="rounded-lg border border-border bg-surface p-3 text-xs">
                    <p className="font-semibold text-foreground truncate">
                      {CATEGORIES.find((c) => c.id === cat)?.label || cat}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-muted-foreground">
                      <span>{stats.correct}/{stats.total} richtig</span>
                      <span className={`font-bold ${pct >= 70 ? "text-emerald-500" : "text-amber-500"}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button variant="primary" onClick={handleRestart} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Assessment wiederholen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="flex flex-col gap-5">
      {skillFocus && skillFocus.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary-soft/20 px-3.5 py-2.5 text-xs">
          <span className="text-foreground">
            <span className="font-semibold text-primary">Fokus aus deinen Skill-Gaps:</span>{" "}
            {skillFocus.join(", ")}
          </span>
          <Button size="sm" variant="outline" onClick={clearSkillFocus}>
            Fokus aufheben
          </Button>
        </div>
      )}

      {/* Category Pills & Progress */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setSkillFocus(null);
                setAnswers({});
                setCurrentIndex(0);
                setIsFinished(false);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Frage {currentIndex + 1} von {filteredQuestions.length}
          </span>
          <div className="h-2 w-28 rounded-full bg-surface-hover overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Frage-Karte */}
      <Card className="border-border bg-surface shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {currentQ.categoryLabel}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              Level: {currentQ.difficulty === "MID_SENIOR" ? "Mid/Senior" : "Junior/Mid"}
            </span>
          </div>
          <CardTitle className="text-base font-semibold text-foreground leading-snug">
            {currentQ.question}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Code Snippet (falls vorhanden) */}
          {currentQ.codeSnippet && (
            <div className="rounded-lg bg-slate-950 p-3.5 font-mono text-xs text-slate-100 overflow-x-auto border border-slate-800 leading-relaxed">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-2 pb-1 border-b border-slate-800">
                <Code2 className="h-3 w-3" /> Code-Ausschnitt:
              </div>
              <pre>{currentQ.codeSnippet}</pre>
            </div>
          )}

          {/* Antwort-Optionen */}
          <div className="space-y-2.5 pt-1">
            {currentQ.options.map((option, idx) => {
              const isSelected = currentSelectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnStyle = "border-border bg-surface hover:bg-surface-hover/60 text-foreground";
              if (hasAnsweredCurrent) {
                if (isCorrect) {
                  btnStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300";
                } else {
                  btnStyle = "opacity-50 border-border bg-surface text-muted-foreground";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={hasAnsweredCurrent}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left rounded-lg border p-3 text-xs transition-all flex items-start gap-3 ${btnStyle}`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-hover text-[11px] font-bold text-muted-foreground mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 leading-relaxed">{option}</span>
                  {hasAnsweredCurrent && isCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  {hasAnsweredCurrent && isSelected && !isCorrect && (
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Erklärung & Key Takeaway (nach Beantwortung) */}
          {hasAnsweredCurrent && (
            <div className="rounded-xl border border-primary/20 bg-primary-soft/20 p-4 space-y-3 animate-fade-in mt-4">
              <div className="flex items-start gap-2 text-xs">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Erklärung:</p>
                  <p className="text-muted-foreground leading-relaxed">{currentQ.explanation}</p>
                </div>
              </div>

              <div className="rounded-lg bg-surface border border-border/80 px-3 py-2 text-xs flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-semibold text-primary">Key-Takeaway fürs Interview:</span>
                <span className="text-foreground">{currentQ.keyTakeaway}</span>
              </div>
            </div>
          )}

          {/* Navigation Button */}
          {hasAnsweredCurrent && (
            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={handleNext} className="gap-1.5 shadow-sm">
                {currentIndex + 1 < filteredQuestions.length ? (
                  <>
                    Nächste Frage <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Ergebnis ansehen <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
