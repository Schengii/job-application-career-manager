"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/core/api";
import { ApplicationListItem } from "@/types";
import { Eye, Save, Star, HelpCircle, Building2, CheckCircle2, Maximize2, Minimize2 } from "lucide-react";

interface InterviewTeleprompterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applications?: ApplicationListItem[];
  defaultAppId?: string;
}

export function InterviewTeleprompterModal({
  open,
  onOpenChange,
  applications = [],
  defaultAppId,
}: InterviewTeleprompterModalProps) {
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string>(defaultAppId || applications[0]?.id || "");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");

  // Post-Interview Quick Notes
  const [quickNote, setQuickNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const selectedApp = applications.find((a) => a.id === selectedId) || applications[0];

  async function handleSaveDebrief() {
    if (!selectedApp || !quickNote.trim()) return;
    setSavingNote(true);
    try {
      await apiPost(`/api/applications/${selectedApp.id}/interactions`, {
        type: "INTERVIEW_ROUND",
        title: "Interview-Notiz (Live-Debrief)",
        summary: quickNote.trim(),
        interactionDate: new Date().toISOString(),
      });
      toast.success("Interview-Erkenntnisse direkt in der Bewerbungshistorie gespeichert!");
      setQuickNote("");
    } catch {
      toast.error("Notiz konnte nicht gespeichert werden.");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-4xl transition-all duration-300 ${
          isFullscreen
            ? "fixed inset-2 max-w-none w-auto h-auto rounded-xl flex flex-col z-50 p-6"
            : "max-h-[90vh] overflow-y-auto"
        }`}
      >
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <div>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Live-Interview Teleprompter & Spickzettel
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optimiert für den Zweitbildschirm während Microsoft Teams-, Zoom- oder Google Meet-Gesprächen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFontSize("sm")}
                className={`px-2 py-0.5 rounded ${fontSize === "sm" ? "bg-primary text-white" : "text-muted-foreground"}`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize("base")}
                className={`px-2 py-0.5 rounded ${fontSize === "base" ? "bg-primary text-white" : "text-muted-foreground"}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("lg")}
                className={`px-2 py-0.5 rounded ${fontSize === "lg" ? "bg-primary text-white" : "text-muted-foreground"}`}
              >
                A+
              </button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
              title={isFullscreen ? "Fenster verkleinern" : "Vollbild"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        {/* Bewerbungswahl */}
        <div className="flex items-center gap-3 py-2 border-b border-border">
          <label className="text-xs font-semibold text-muted-foreground shrink-0">Bewerbung:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-md border border-input bg-surface px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.company.name} — {app.position}
              </option>
            ))}
          </select>
        </div>

        {selectedApp && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 flex-1 overflow-y-auto">
            {/* Spalte 1: Unternehmens-Fakten & Eigene STAR-Story */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Building2 className="h-4 w-4" />
                  <span>Company-Briefing: {selectedApp.company.name}</span>
                </div>
                <div className={`space-y-1.5 ${fontSize === "sm" ? "text-xs" : fontSize === "lg" ? "text-base" : "text-sm"}`}>
                  <p><strong>Position:</strong> {selectedApp.position}</p>
                  {selectedApp.company.contactName && (
                    <p><strong>Gesprächspartner:</strong> {selectedApp.company.contactName}</p>
                  )}
                  {selectedApp.jobPosting?.techStack && (
                    <p><strong>Geforderter Stack:</strong> {selectedApp.jobPosting.techStack}</p>
                  )}
                  {selectedApp.company.notes && (
                    <p className="text-muted-foreground bg-surface-hover/50 p-2 rounded text-xs mt-1">
                      <em>Notizen:</em> {selectedApp.company.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* STAR Elevator Pitch */}
              <div className="rounded-xl border border-primary/20 bg-primary-soft/10 p-4 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>Mein STAR-Projekt-Pitch (electroCheck-ai)</span>
                </div>
                <div className={`space-y-1.5 text-foreground leading-relaxed ${fontSize === "sm" ? "text-xs" : fontSize === "lg" ? "text-base" : "text-sm"}`}>
                  <p><strong>S (Situation):</strong> Entwicklung einer KI-gestützten Prüf-App für Elektro-Messungen.</p>
                  <p><strong>T (Task):</strong> Modernes Web-Frontend mit Next.js 16, TypeScript und Tailwind v4 mit 100% Offline-Fähigkeit.</p>
                  <p><strong>A (Action):</strong> Saubere Architektur mit Server Actions, Type-Safe Zod-Schemas und Unit-Tests via Vitest.</p>
                  <p><strong>R (Result):</strong> 99,8% Testabdeckung, extrem schnelle Reaktionszeiten (INP &lt; 50ms) und fehlerfreie Typisierung.</p>
                </div>
              </div>
            </div>

            {/* Spalte 2: Rückfragen an das Unternehmen & Sofort-Debrief */}
            <div className="space-y-4 flex flex-col">
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  <HelpCircle className="h-4 w-4" />
                  <span>Top-Rückfragen an den Arbeitgeber</span>
                </div>
                <ul className={`list-disc list-inside space-y-1.5 text-muted-foreground ${fontSize === "sm" ? "text-xs" : fontSize === "lg" ? "text-base" : "text-sm"}`}>
                  <li>Wie sieht euer typischer Deployment- und Code-Review-Workflow aus?</li>
                  <li>Welche Freiheiten hat das Frontend-Team bei Architekturentscheidungen?</li>
                  <li>Wie wird Weiterbildung (z. B. Konferenzen, Zertifizierungen) bei euch gefördert?</li>
                  <li>Was wäre meine wichtigste Aufgabe in den ersten 90 Tagen?</li>
                </ul>
              </div>

              {/* Post-Call Debrief Notizen */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2.5 shadow-xs flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Post-Call Debrief (Sofort-Notiz)
                  </span>
                  <span className="text-[11px] text-muted-foreground">Wird in Historie gespeichert</span>
                </div>
                <Textarea
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Wie war die Stimmung? Welche technischen Fragen kamen auf? Nächste Schritte?"
                  rows={3}
                  className="text-xs resize-none flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={handleSaveDebrief}
                  disabled={savingNote || !quickNote.trim()}
                  className="w-full text-xs h-8"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {savingNote ? "Speichere..." : "Als Gesprächs-Notiz ablegen"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
