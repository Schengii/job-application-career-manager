"use client";

import { useState } from "react";
import {
  Trash2,
  Plus,
  Copy,
  BookOpen,
  Send,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import {
  StarStory,
  STAR_CATEGORIES,
  STAR_PRESETS,
  validateStarStory,
  formatStarStoryForTeleprompter,
} from "@/lib/interview/starStoryBuilder";

const STORAGE_KEY = "career_prep_star_stories_v1";

interface StarStoryBuilderCardProps {
  onSendToTeleprompter?: (text: string) => void;
}

export function StarStoryBuilderCard({ onSendToTeleprompter }: StarStoryBuilderCardProps) {
  const toast = useToast();
  const [stories, setStories] = useState<StarStory[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as StarStory[];
      }
      const initial = STAR_PRESETS.map((p, idx) => ({
        ...p,
        id: `star-story-${Date.now()}-${idx}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      } catch {}
      return initial;
    } catch {
      return [];
    }
  });

  const initialStory = stories[0] || null;
  const [activeStoryId, setActiveStoryId] = useState<string | null>(initialStory?.id ?? null);

  // Form State
  const [title, setTitle] = useState(initialStory?.title ?? "");
  const [category, setCategory] = useState<StarStory["category"]>(initialStory?.category ?? "OPTIMIZATION");
  const [situation, setSituation] = useState(initialStory?.situation ?? "");
  const [task, setTask] = useState(initialStory?.task ?? "");
  const [action, setAction] = useState(initialStory?.action ?? "");
  const [result, setResult] = useState(initialStory?.result ?? "");
  const [keyTakeaway, setKeyTakeaway] = useState(initialStory?.keyTakeaway || "");
  const [techTagsStr, setTechTagsStr] = useState(initialStory?.techTags.join(", ") ?? "");

  function saveToStorage(updated: StarStory[]) {
    setStories(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }

  function selectStory(s: StarStory) {
    setActiveStoryId(s.id);
    setTitle(s.title);
    setCategory(s.category);
    setSituation(s.situation);
    setTask(s.task);
    setAction(s.action);
    setResult(s.result);
    setKeyTakeaway(s.keyTakeaway || "");
    setTechTagsStr(s.techTags.join(", "));
  }

  function handleCreateNew() {
    const newStory: StarStory = {
      id: `star-${Date.now()}`,
      title: "Neues Praxis-Beispiel (STAR)",
      category: "PROBLEM_SOLVING",
      situation: "",
      task: "",
      action: "",
      result: "",
      keyTakeaway: "",
      techTags: ["React", "TypeScript"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [newStory, ...stories];
    saveToStorage(next);
    selectStory(newStory);
    toast.success("Neue STAR-Story angelegt!");
  }

  function handleSaveCurrent() {
    if (!activeStoryId) return;
    const tags = techTagsStr
      .split(/[,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const updated = stories.map((s) => {
      if (s.id !== activeStoryId) return s;
      return {
        ...s,
        title: title.trim() || "Unbenanntes Beispiel",
        category,
        situation,
        task,
        action,
        result,
        keyTakeaway,
        techTags: tags,
        updatedAt: new Date().toISOString(),
      };
    });

    saveToStorage(updated);
    toast.success("STAR-Story erfolgreich gespeichert!");
  }

  function handleDeleteCurrent(id: string) {
    const next = stories.filter((s) => s.id !== id);
    saveToStorage(next);
    if (next.length > 0) {
      selectStory(next[0]);
    } else {
      setActiveStoryId(null);
      setTitle("");
      setSituation("");
      setTask("");
      setAction("");
      setResult("");
      setKeyTakeaway("");
      setTechTagsStr("");
    }
    toast.success("Story entfernt.");
  }

  const activeStory = stories.find((s) => s.id === activeStoryId);
  const validation = validateStarStory({
    situation,
    task,
    action,
    result,
  });

  function handleCopyForTeleprompter() {
    if (!activeStory) return;
    const formatted = formatStarStoryForTeleprompter({
      ...activeStory,
      title,
      category,
      situation,
      task,
      action,
      result,
      keyTakeaway,
      techTags: techTagsStr.split(",").map((t) => t.trim()).filter(Boolean),
    });
    navigator.clipboard.writeText(formatted);
    toast.success("In Zwischenablage kopiert!");
  }

  function handleTransferToTeleprompter() {
    if (!activeStory) return;
    const formatted = formatStarStoryForTeleprompter({
      ...activeStory,
      title,
      category,
      situation,
      task,
      action,
      result,
      keyTakeaway,
      techTags: techTagsStr.split(",").map((t) => t.trim()).filter(Boolean),
    });
    if (onSendToTeleprompter) {
      onSendToTeleprompter(formatted);
      toast.success("Story an Teleprompter übergeben!");
    } else {
      handleCopyForTeleprompter();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Story-Liste links */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Deine STAR-Storys ({stories.length})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleCreateNew} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Neu
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {stories.map((s) => {
              const catObj = STAR_CATEGORIES.find((c) => c.id === s.category);
              const isActive = s.id === activeStoryId;
              const val = validateStarStory(s);
              return (
                <div
                  key={s.id}
                  onClick={() => selectStory(s)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isActive
                      ? "border-primary bg-primary-soft/40 shadow-xs"
                      : "border-border bg-surface hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold line-clamp-1 text-foreground">
                      {catObj?.icon} {s.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        val.score >= 80
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : val.score >= 50
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {val.score}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {s.situation || "Noch kein Kontext eingetragen..."}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.techTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded-sm text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Quick Hint Card */}
        <Card className="border-border bg-muted/30">
          <CardContent className="pt-4 text-xs space-y-2 text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <HelpCircle className="h-4 w-4 text-primary" />
              Warum die STAR-Methode?
            </div>
            <p>
              In Verhaltensfragen (<em>Behavioral Interviews</em>) wollen HR und Lead-Entwickler keine
              theoretischen Floskeln hören, sondern greifbare Beispiele: <strong>S</strong>ituation,
              <strong> T</strong>ask, <strong> A</strong>ktion (Ich-Form!) und messbares <strong> R</strong>esultat.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Editor & Quality-Audit rechts */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {activeStory ? (
          <Card className="border-border">
            <CardHeader className="pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  STAR-Story Editor
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Erfasse dein Fallbeispiel mit Fokus auf deine Eigenleistung und messbaren Nutzen.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTransferToTeleprompter}
                  className="h-8 text-xs text-primary border-primary/30 hover:bg-primary-soft"
                  title="Story für Live-Teleprompter bereitstellen"
                >
                  <Send className="h-3.5 w-3.5 mr-1" /> An Teleprompter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyForTeleprompter}
                  className="h-8 text-xs"
                  title="Formatierten Text kopieren"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Kopieren
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteCurrent(activeStory.id)}
                  className="h-8 text-xs"
                  title="Story löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="primary" onClick={handleSaveCurrent} className="h-8 text-xs font-semibold">
                  Speichern
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Score Bar */}
              <div className="p-3 rounded-lg border border-border bg-surface flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      validation.score >= 80
                        ? "bg-emerald-500"
                        : validation.score >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    Interview-Impact Score: {validation.score} / 100
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {validation.score >= 80
                    ? "🌟 Felsenfeste Antwort für Senior-Interviews"
                    : validation.score >= 50
                    ? "👍 Gute Basis, schärfe die Ich-Aktion und Metriken nach"
                    : "⚠️ Noch lückenhaft (Kontext, Details oder Metriken fehlen)"}
                </span>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs">Titel / Schlagwort des Falls</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z. B. Performance-Optimierung der Prüfberichte"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kategorie</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StarStory["category"])}
                    className="w-full h-9 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    {STAR_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* S: Situation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                      S
                    </span>
                    Situation (Ausgangslage, Unternehmen, Projekt)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">{validation.feedback.situation}</span>
                </div>
                <Textarea
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  rows={2}
                  placeholder="In welchem Projekt / bei welchem Kunden trat das Problem auf? Wie sah das Umfeld aus?"
                  className="text-xs"
                />
              </div>

              {/* T: Task */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">
                      T
                    </span>
                    Task (Aufgabenstellung & Herausforderung)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">{validation.feedback.task}</span>
                </div>
                <Textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  rows={2}
                  placeholder="Was genau war das konkrete Ziel oder die Kernanforderung, die bewältigt werden musste?"
                  className="text-xs"
                />
              </div>

              {/* A: Action */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                      A
                    </span>
                    Action (Deine konkrete Handlung & technische Umsetzung)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">{validation.feedback.action}</span>
                </div>
                <Textarea
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  rows={3}
                  placeholder="Ich habe... (Welche Bibliotheken, Patterns, Architekturmuster hast du gewählt und warum?)"
                  className="text-xs"
                />
              </div>

              {/* R: Result */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                      R
                    </span>
                    Result (Messbares Ergebnis & Nutzen)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">{validation.feedback.result}</span>
                </div>
                <Textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  rows={2}
                  placeholder="Was war das messbare Resultat? (z.B. Ladezeit um 40% gesenkt, Testabdeckung von 0 auf 80%, zufriedenes Feedback)"
                  className="text-xs"
                />
              </div>

              {/* Takeaway & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs">Wichtigstes Learning / Takeaway (Optional)</Label>
                  <Input
                    value={keyTakeaway}
                    onChange={(e) => setKeyTakeaway(e.target.value)}
                    placeholder="z. B. Strikte Runtime-Validierung an API-Grenzen..."
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Technologien (Kommagetrennt)</Label>
                  <Input
                    value={techTagsStr}
                    onChange={(e) => setTechTagsStr(e.target.value)}
                    placeholder="React, TypeScript, Zod, Vitest"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border p-8 text-center text-muted-foreground">
            Wähle links eine STAR-Story aus oder lege eine neue an.
          </Card>
        )}
      </div>
    </div>
  );
}
