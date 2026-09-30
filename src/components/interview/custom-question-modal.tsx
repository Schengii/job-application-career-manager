"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/form";
import type { InterviewQuestion, QuestionCategory } from "@/lib/interview/interviewGuide";
import { saveCustomQuestion } from "@/lib/interview/customQuestionStorage";
import { useToast } from "@/components/ui/toast";

interface CustomQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: (question: InterviewQuestion) => void;
}

export function CustomQuestionModal({ open, onClose, onAdded }: CustomQuestionModalProps) {
  const toast = useToast();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<QuestionCategory>("CAREER_BACKGROUND");
  const [keywords, setKeywords] = useState("");
  const [tips, setTips] = useState("");

  function handleSave() {
    if (!question.trim()) {
      toast.error("Bitte gib eine Frage ein.");
      return;
    }

    const categoryLabels: Record<QuestionCategory, string> = {
      FRONTEND_REACT: "React & Frontend",
      TYPESCRIPT_JS: "TypeScript & JavaScript",
      CSS_UI_UX: "CSS & UI/UX",
      ARCHITECTURE_TESTING: "Architektur & Testing",
      CAREER_BACKGROUND: "Werdegang & Praxis",
      QUESTIONS_FOR_EMPLOYER: "Gegenfragen an Arbeitgeber",
    };

    const parsedKeywords = keywords
      .split(/[, ]+/)
      .map((k) => k.trim().replace(/^#/, ""))
      .filter(Boolean);

    const saved = saveCustomQuestion({
      category,
      categoryLabel: categoryLabels[category],
      question: question.trim(),
      answerSummary: answer.trim() || "Keine Musterantwort hinterlegt.",
      keywords: parsedKeywords.length > 0 ? parsedKeywords : ["Eigenes-Interview"],
      tips: tips.trim() || undefined,
    });

    toast.success("Eigene Frage erfolgreich zum Fragenkatalog hinzugefügt!");
    onAdded(saved);
    onClose();
    setQuestion("");
    setAnswer("");
    setKeywords("");
    setTips("");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-6 bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Plus className="h-5 w-5 text-primary" /> Eigene Interviewfrage hinzufügen
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Ergänze reale Fragen aus deinen Vorstellungsgesprächen, um gezielt dafür zu trainieren.
          </p>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-xs">
          <div>
            <label className="font-semibold text-foreground">Kategorie</label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as QuestionCategory)}
              className="mt-1 w-full"
            >
              <option value="FRONTEND_REACT">React & Frontend</option>
              <option value="TYPESCRIPT_JS">TypeScript & JavaScript</option>
              <option value="CSS_UI_UX">CSS & UI/UX</option>
              <option value="ARCHITECTURE_TESTING">Architektur & Testing</option>
              <option value="CAREER_BACKGROUND">Werdegang & Praxis</option>
              <option value="QUESTIONS_FOR_EMPLOYER">Gegenfragen an Arbeitgeber</option>
            </Select>
          </div>

          <div>
            <label className="font-semibold text-foreground">Die gestellte Frage *</label>
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="z.B. Wie würdest du ein Memory-Leak in einer React-App analysieren?"
              className="mt-1 w-full rounded-md border border-border bg-surface p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground">Deine Antwort oder Stichpunkte</label>
            <textarea
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="z.B. Chrome DevTools Heap Snapshots, Event Listener unbinden, AbortController..."
              className="mt-1 w-full rounded-md border border-border bg-surface p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground">Keywords (kommasepariert)</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Performance, Memory, React, DevTools"
              className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground">Persönlicher Tipp / Notiz (optional)</label>
            <input
              type="text"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder="Wichtig: Konkretes Beispiel aus eigenem Projekt erwähnen."
              className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Abbrechen
          </Button>
          <Button size="sm" onClick={handleSave}>
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
