"use client";

// -----------------------------------------------------------------------------
// Live Coding-Challenge Canvas & Sandbox für Frontend-Interviews
// -----------------------------------------------------------------------------
import { useState } from "react";
import {
  Code,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  CODING_CHALLENGES,
  CodingChallenge,
  executeChallengeCode,
  ExecutionResult,
} from "@/lib/codingChallenges";

export function CodingChallengeCanvas() {
  const [selectedChallenge, setSelectedChallenge] = useState<CodingChallenge>(CODING_CHALLENGES[0]);
  const [code, setCode] = useState(selectedChallenge.starterCode);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);

  function handleSelectChallenge(c: CodingChallenge) {
    setSelectedChallenge(c);
    setCode(c.starterCode);
    setResult(null);
    setShowHint(false);
    setShowSolution(false);
  }

  function handleRun() {
    const res = executeChallengeCode(selectedChallenge, code);
    setResult(res);
    if (res.success && !solvedIds.includes(selectedChallenge.id)) {
      setSolvedIds((prev) => [...prev, selectedChallenge.id]);
    }
  }

  function handleReset() {
    setCode(selectedChallenge.starterCode);
    setResult(null);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Linke Spalte: Aufgaben-Liste */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Live-Coding Aufgaben
          </span>
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            <Award className="h-3.5 w-3.5" /> {solvedIds.length}/{CODING_CHALLENGES.length} gelöst
          </span>
        </div>

        <div className="space-y-2">
          {CODING_CHALLENGES.map((c) => {
            const isSelected = selectedChallenge.id === c.id;
            const isSolved = solvedIds.includes(c.id);

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectChallenge(c)}
                className={`w-full text-left rounded-xl border p-3 transition-all flex items-start justify-between gap-2 ${
                  isSelected
                    ? "border-primary bg-primary-soft/40 shadow-xs ring-1 ring-primary/30"
                    : "border-border bg-surface hover:bg-surface-hover/70"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[9.5px] font-bold text-muted-foreground">
                      {c.category}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold ${
                        c.difficulty === "Junior"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : c.difficulty === "Mid"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {c.difficulty}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{c.title}</p>
                </div>

                {isSolved && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rechte Spalte: Editor & Terminal */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-border shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-surface/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Code className="h-4 w-4 text-primary" />
                {selectedChallenge.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={handleReset} title="Code zurücksetzen">
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
                <Button size="sm" variant="primary" onClick={handleRun}>
                  <Play className="h-3.5 w-3.5 mr-1 fill-white" /> Ausführen & Testen
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {selectedChallenge.description}
            </p>
          </CardHeader>

          <CardContent className="p-0">
            {/* Code Editor */}
            <div className="relative font-mono text-xs">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={12}
                spellCheck={false}
                className="w-full bg-slate-950 text-slate-100 p-4 font-mono text-xs focus:outline-none focus:ring-0 leading-relaxed resize-y"
              />
            </div>

            {/* Test-Ergebnis / Terminal */}
            {result && (
              <div
                className={`p-4 border-t border-border/60 text-xs font-mono space-y-1.5 ${
                  result.success ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                    )}
                    {result.success
                      ? "Alle Testfälle erfolgreich bestanden! 🎉"
                      : `Einige Tests fehlgeschlagen (${result.passedTests}/${result.totalTests})`}
                  </span>
                </div>
                <div className="space-y-1 pt-1 text-[11.5px]">
                  {result.logs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hilfen & Lösung Footer */}
            <div className="flex items-center justify-between p-3 border-t border-border bg-surface text-xs">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowHint(!showHint)}
                  className="h-7 text-xs"
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  {showHint ? "Tipp verbergen" : "Tipp anzeigen"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSolution(!showSolution)}
                  className="h-7 text-xs text-muted-foreground"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {showSolution ? "Musterlösung verbergen" : "Musterlösung anzeigen"}
                </Button>
              </div>
            </div>

            {showHint && (
              <div className="p-3.5 bg-amber-500/10 border-t border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                💡 <strong>Tipp:</strong> {selectedChallenge.hint}
              </div>
            )}

            {showSolution && (
              <div className="p-4 bg-slate-900 border-t border-border text-slate-100 text-xs font-mono">
                <div className="text-[11px] font-bold text-indigo-400 mb-2">Musterlösung:</div>
                <pre className="overflow-x-auto whitespace-pre">{selectedChallenge.solutionCode}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
