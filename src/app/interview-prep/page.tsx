"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Sparkles,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  MessageSquare,
  Mic,
  Printer,
  Target,
  Star,
} from "lucide-react";
import { fetcher } from "@/lib/api";
import { ApplicationListItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import {
  INTERVIEW_QUESTIONS,
  QuestionCategory,
  InterviewQuestion,
} from "@/lib/interviewGuide";
import { MockInterviewModal } from "@/components/interview/mock-interview-modal";
import { VoiceInterviewRunner } from "@/components/interview/voice-interview-runner";
import { SalaryNegotiationTrainer } from "@/components/interview/salary-negotiation-trainer";
import { TechQuizSimulator } from "@/components/interview/tech-quiz-simulator";
import { CodingChallengeCanvas } from "@/components/interview/coding-challenge-canvas";
import { QuestionNoteEditor } from "@/components/interview/question-note-editor";
import { AudioInterviewRecorder } from "@/components/interview/audio-interview-recorder";
import { StarAuditModal } from "@/components/interview/star-audit-modal";
import { generateInterviewCheatsheetHtml } from "@/lib/interviewCheatsheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SkillGapAnalysisResult } from "@/lib/skillGapAnalyzer";
import { getQuizFocusRecommendations } from "@/lib/skillGapToQuizFocus";

const TABS = [
  { id: "questions", label: "Fachfragen-Katalog & Leitfaden" },
  { id: "tech_quiz", label: "Tech- & Coding-Quiz ⚡ (React 19 / TS)" },
  { id: "coding_canvas", label: "Live-Coding Challenges 💻" },
  { id: "negotiation", label: "Gehaltsverhandlungs-Coach (Roleplay)" },
] as const;

type PrepTab = (typeof TABS)[number]["id"];

const CATEGORIES: { id: "ALL" | QuestionCategory; label: string }[] = [
  { id: "ALL", label: "Alle Bereiche" },
  { id: "FRONTEND_REACT", label: "React & Frontend" },
  { id: "TYPESCRIPT_JS", label: "TypeScript & JavaScript" },
  { id: "CSS_UI_UX", label: "CSS & UI/UX" },
  { id: "ARCHITECTURE_TESTING", label: "Architektur & Testing" },
  { id: "CAREER_BACKGROUND", label: "Werdegang & Praxis" },
  { id: "QUESTIONS_FOR_EMPLOYER", label: "Gegenfragen an Arbeitgeber" },
];

export default function InterviewPrepPage() {
  const { data: applications } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);
  const { data: skillGapAnalysis } = useSWR<SkillGapAnalysisResult>(
    "/api/analytics/skill-gap",
    fetcher
  );

  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | QuestionCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());

  const [mockInterviewOpen, setMockInterviewOpen] = useState(false);
  const [voiceSimulatorOpen, setVoiceSimulatorOpen] = useState(false);
  const [starAuditOpen, setStarAuditOpen] = useState(false);
  const [starAuditQuestion, setStarAuditQuestion] = useState("");
  const [starAuditAnswer, setStarAuditAnswer] = useState("");
  const [activeTab, setActiveTab] = useState<PrepTab>("questions");
  const [quizSkillFocus, setQuizSkillFocus] = useState<string[] | undefined>(undefined);

  const quizFocusRecommendations = useMemo(() => {
    if (!skillGapAnalysis?.highDemandMissing) return [];
    return getQuizFocusRecommendations(skillGapAnalysis.highDemandMissing);
  }, [skillGapAnalysis]);

  function startQuizForSkill(skill: string) {
    setQuizSkillFocus([skill]);
    setActiveTab("tech_quiz");
  }

  const selectedApp = useMemo(
    () => applications?.find((a) => a.id === selectedAppId),
    [applications, selectedAppId]
  );

  const relevantQuestions = useMemo(() => {
    let list: InterviewQuestion[] = INTERVIEW_QUESTIONS;

    if (selectedApp?.jobPosting?.techStack) {
      const stack = selectedApp.jobPosting.techStack.toLowerCase();
      list = [...list].sort((a, b) => {
        const aMatch = a.keywords.some((k) => stack.includes(k.toLowerCase()));
        const bMatch = b.keywords.some((k) => stack.includes(k.toLowerCase()));
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    if (selectedCategory !== "ALL") {
      list = list.filter((q) => q.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answerSummary.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedApp, selectedCategory, searchQuery]);

  function toggleCheck(id: string) {
    setCheckedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const progressPct =
    INTERVIEW_QUESTIONS.length > 0
      ? Math.round((checkedQuestions.size / INTERVIEW_QUESTIONS.length) * 100)
      : 0;

  function handlePrintCheatsheet() {
    const personalNotes: Record<string, string> = {};
    for (const q of relevantQuestions) {
      try {
        const saved = localStorage.getItem(`career_prep_note_${q.id}`);
        if (saved) personalNotes[q.id] = saved;
      } catch {}
    }

    const html = generateInterviewCheatsheetHtml({
      candidateName: "Max Mustermann",
      companyName: selectedApp?.company.name,
      position: selectedApp?.position,
      questions: checkedQuestions.size > 0
        ? relevantQuestions.filter((q) => checkedQuestions.has(q.id))
        : relevantQuestions.slice(0, 10),
      personalNotes,
    });

    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 250);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Interview-Vorbereitungsleitfaden</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Strukturierte Fachfragen, interaktiver Gehaltsverhandlungs-Coach und Audio-Sprachsimulator.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrintCheatsheet}
            title="Druckfertiges 2-Seiten Cheatsheet mit deinen Notizen erzeugen"
          >
            <Printer className="h-4 w-4 mr-1.5 text-primary" /> Spickzettel drucken
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setVoiceSimulatorOpen(true)}
            className="shadow-sm"
          >
            <Mic className="h-4 w-4 mr-1.5" /> Voice-Dialog Simulator 🎙️
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMockInterviewOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1.5" /> Standard-Simulator
          </Button>
        </div>
      </header>

      {/* Empfehlung basierend auf Skill-Gap-Matrix */}
      {quizFocusRecommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary-soft/10">
          <CardContent className="pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                Empfohlen basierend auf deinen Skill-Gaps
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quizFocusRecommendations.map((rec) => (
                <button
                  key={rec.skill}
                  type="button"
                  onClick={() => startQuizForSkill(rec.skill)}
                  className="flex items-center gap-2 rounded-full border border-primary/30 bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/10"
                  title={`${rec.questionCount} passende Frage(n) im Tech-Quiz üben`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      rec.priority === "HIGH" ? "bg-rose-500" : "bg-amber-500"
                    }`}
                  />
                  {rec.skill}
                  <span className="text-muted-foreground">
                    ({rec.marketDemandPercentage}% Marktnachfrage)
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Haupt-Tab-Leiste */}
      <div className="flex flex-wrap gap-2 border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.id
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "negotiation" ? (
        <SalaryNegotiationTrainer />
      ) : activeTab === "tech_quiz" ? (
        <TechQuizSimulator
          key={quizSkillFocus?.join(",") ?? "all"}
          initialSkillFocus={quizSkillFocus}
        />
      ) : activeTab === "coding_canvas" ? (
        <CodingChallengeCanvas />
      ) : (
        <>
          {/* Bewerbungs-Filter / Kontexterkennung */}
          <Card className="bg-primary-soft/30 border-primary/20">
            <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Vorbereitung auf eine konkrete Stelle:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Select
                      value={selectedAppId}
                      onChange={(e) => setSelectedAppId(e.target.value)}
                      className="h-8 text-xs font-medium w-auto"
                    >
                      <option value="">Allgemeine Vorbereitung (Alle Fragen)</option>
                      {applications?.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.company.name} – {a.position}
                        </option>
                      ))}
                    </Select>
                    {selectedApp && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const stack = selectedApp.jobPosting?.techStack || selectedApp.position;
                          const skills = stack.split(/[,/ ]+/).map((s) => s.trim()).filter(Boolean);
                          setQuizSkillFocus(skills);
                          setActiveTab("tech_quiz");
                        }}
                        className="h-8 text-xs border-primary/30 text-primary hover:bg-primary-soft font-semibold"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" /> Stellen-Quiz ({selectedApp.company.name})
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Vorbereitungs-Fortschritt</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2.5 w-32 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground">{progressPct}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter & Suche */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5" role="tablist">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
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

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Frage oder Keyword suchen …"
                className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Fragen-Liste */}
          <div className="flex flex-col gap-3">
            {relevantQuestions.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Keine Fragen für diese Filterauswahl gefunden.
              </p>
            )}

            {relevantQuestions.map((q) => {
              const isExpanded = expandedId === q.id;
              const isChecked = checkedQuestions.has(q.id);

              return (
                <Card
                  key={q.id}
                  className={`transition-all duration-200 ${
                    isChecked ? "border-success/40 bg-success-soft/20" : ""
                  }`}
                >
                  <div
                    className="flex items-start justify-between gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCheck(q.id);
                        }}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          isChecked
                            ? "border-success bg-success text-white"
                            : "border-border hover:border-primary text-transparent"
                        }`}
                        title={isChecked ? "Als unvorbereitet markieren" : "Als vorbereitet markieren"}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {q.categoryLabel}
                          </span>
                        </div>
                        <p className={`text-sm font-semibold ${isChecked ? "text-success-foreground" : "text-foreground"}`}>
                          {q.question}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                      aria-label="Details umschalten"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-4 pl-12 border-t border-border/50 mt-1">
                      <div className="rounded-lg bg-surface-hover/60 p-3.5 space-y-2 mt-3 text-xs leading-relaxed">
                        <div>
                          <p className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" /> Kernantwort & Leitfaden:
                          </p>
                          <p className="text-muted-foreground">{q.answerSummary}</p>
                        </div>

                        {q.tips && (
                          <div className="border-t border-border/60 pt-2 text-primary">
                            <span className="font-semibold flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Interview-Tipp:
                            </span>
                            <p className="text-muted-foreground">{q.tips}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 pt-1">
                          {q.keywords.map((kw) => (
                            <span
                              key={kw}
                              className="rounded-full bg-surface border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                            >
                              #{kw}
                            </span>
                          ))}
                        </div>

                        <div className="space-y-3 pt-1">
                          <QuestionNoteEditor questionId={q.id} />
                          <AudioInterviewRecorder questionTitle={q.question} />
                          <div className="flex justify-end pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const saved = typeof window !== "undefined" ? localStorage.getItem(`career_prep_note_${q.id}`) || "" : "";
                                setStarAuditQuestion(q.question);
                                setStarAuditAnswer(saved || q.answerSummary);
                                setStarAuditOpen(true);
                              }}
                              className="h-7 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                            >
                              <Star className="h-3 w-3 mr-1 text-amber-500 fill-amber-500/20" /> STAR-Methoden-Audit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <StarAuditModal
        open={starAuditOpen}
        onClose={() => setStarAuditOpen(false)}
        question={starAuditQuestion}
        answer={starAuditAnswer}
      />

      <MockInterviewModal
        open={mockInterviewOpen}
        onClose={() => setMockInterviewOpen(false)}
        questions={relevantQuestions}
      />

      <Dialog open={voiceSimulatorOpen} onOpenChange={() => setVoiceSimulatorOpen(false)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Mic className="h-5 w-5 text-primary animate-pulse" /> Voice-First KI-Interview Simulator
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <VoiceInterviewRunner
              targetJobTitle={selectedApp ? `${selectedApp.company.name} – ${selectedApp.position}` : undefined}
              onFinish={() => setVoiceSimulatorOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
