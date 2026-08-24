"use client";

// -----------------------------------------------------------------------------
// Markdown-Notizen & Checklisten-Editor für Vorstellungsgespräche
// -----------------------------------------------------------------------------
import { useState } from "react";
import {
  FileText,
  CheckSquare,
  Save,
  Eye,
  Edit3,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const DEFAULT_CHECKLIST = [
  { id: "cv", label: "Lebenslauf & Zeugnisse griffbereit", done: true },
  { id: "pitch", label: "2-Minuten Selbstpräsentation (Umschulung & electroCheck-ai)", done: true },
  { id: "tech", label: "Kamera, Mikrofon & Internetverbindung getestet", done: false },
  { id: "questions", label: "Mindestens 3 eigene Fragen an das Team notiert", done: false },
  { id: "salary", label: "Gehaltsvorstellung & Argumentationskette parat", done: false },
  { id: "company", label: "Unternehmens-Website & Tech-Stack recherchiert", done: false },
];

const TEMPLATE_NOTE = `### 🎯 Gesprächsnotizen

**Gesprächspartner:** 
**Datum / Format:** Teams / Vor Ort

#### 💡 Wichtige Erkenntnisse:
- Tech-Stack im Team: React, TypeScript, Next.js
- Teamgröße & Arbeitsweise: 6 Entwickler, 2-Wochen-Sprints (Scrum)
- Geplantes Onboarding: 1:1 Mentoring in den ersten 3 Monaten

#### ❓ Gestellte Fachfragen:
1. *State Management:* Wie handhaben wir asynchrone API-Calls?
2. *Testing:* Wie hoch ist die Testabdeckung im Frontend?

#### 🌟 Mein Eindruck:
- Sehr offene und wertschätzende Atmosphäre.
- Hohes Interesse an den praktischen Vorerfahrungen aus der Ausbildung.
`;

export function InterviewNotesEditor({
  applicationId,
  companyName,
  initialNotes,
  onSaveNotes,
}: {
  applicationId: string;
  companyName: string;
  initialNotes?: string | null;
  onSaveNotes?: (notes: string) => Promise<unknown>;
}) {
  const toast = useToast();
  const storageNotesKey = `career_interview_notes_${applicationId}`;
  const storageChecklistKey = `career_checklist_${applicationId}`;

  const [activeTab, setActiveTab] = useState<"notes" | "checklist" | "offer">("notes");
  const [isPreview, setIsPreview] = useState(false);

  const [notes, setNotes] = useState<string>(() => {
    if (typeof window === "undefined") return initialNotes || "";
    try {
      const saved = localStorage.getItem(storageNotesKey);
      return saved !== null ? saved : initialNotes || "";
    } catch {
      return initialNotes || "";
    }
  });

  const [checklist, setChecklist] = useState<typeof DEFAULT_CHECKLIST>(() => {
    if (typeof window === "undefined") return DEFAULT_CHECKLIST;
    try {
      const saved = localStorage.getItem(storageChecklistKey);
      return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST;
    } catch {
      return DEFAULT_CHECKLIST;
    }
  });

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem(storageNotesKey, notes);
      localStorage.setItem(storageChecklistKey, JSON.stringify(checklist));
      if (onSaveNotes) {
        await onSaveNotes(notes);
      }
      toast.success("Interview-Notizen & Checkliste gespeichert!");
    } catch {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  function toggleCheck(id: string) {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setChecklist(updated);
    try {
      localStorage.setItem(storageChecklistKey, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  function handleInsertTemplate() {
    if (notes.trim() && !confirm("Bestehende Notizen mit Vorlage ergänzen?")) return;
    setNotes(notes ? `${notes}\n\n${TEMPLATE_NOTE}` : TEMPLATE_NOTE);
    toast.success("Interview-Vorlage eingefügt!");
  }

  const completedCount = checklist.filter((c) => c.done).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">
              Interview-Leitfaden & Gesprächsnotizen
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Vorbereitung, strukturierte Notizen & Checkliste für {companyName}
            </p>
          </div>
        </div>

        {/* Tab-Wechsel */}
        <div className="flex items-center rounded-lg border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === "notes"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Notizen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("checklist")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              activeTab === "checklist"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" /> Checkliste ({completedCount}/{checklist.length})
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tab 1: Markdown-Notizen */}
        {activeTab === "notes" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsPreview(!isPreview)}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  {isPreview ? (
                    <>
                      <Edit3 className="h-3.5 w-3.5" /> Bearbeiten
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Vorschau
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleInsertTemplate}
                  className="h-7 text-xs text-muted-foreground hover:text-primary"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Vorlage einfügen
                </Button>
              </div>

              <span className="text-[10px] text-muted-foreground">Markdown wird unterstützt</span>
            </div>

            {!isPreview ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Hier Notizen zum Gespräch, Fragen an das Team, Feedback und Gehaltsdetails eintragen …"
                rows={10}
                className="w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            ) : (
              <div className="min-h-[200px] rounded-lg border border-border bg-surface p-4 text-xs text-foreground space-y-2 whitespace-pre-wrap leading-relaxed">
                {notes || <span className="italic text-muted-foreground">Noch keine Notizen vorhanden.</span>}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Interview Checkliste */}
        {activeTab === "checklist" && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Vorbereitungs-Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{progressPercent}% erledigt</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden border border-border">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Checkliste Items */}
            <div className="space-y-2">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className={`w-full flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-all ${
                    item.done
                      ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:bg-surface-hover"
                  }`}
                >
                  <span className={`text-xs font-medium ${item.done ? "line-through opacity-80" : ""}`}>
                    {item.label}
                  </span>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      item.done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border bg-surface"
                    }`}
                  >
                    {item.done && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-2 border-t border-border/50">
          <Button size="sm" onClick={handleSave} disabled={saving} className="card-hover-effect">
            <Save className="h-4 w-4 text-white" />
            <span>{saving ? "Speichere …" : "Notizen & Checkliste sichern"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
