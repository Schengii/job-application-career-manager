"use client";

// -----------------------------------------------------------------------------
// Anschreiben-Panel mit Tonalitäts-Auswahl, DIN 5008 Druck & Nachfass-Generator
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR from "swr";
import { Sparkles, Save, Send, Printer, Mail } from "lucide-react";
import { apiPost, apiPatch, fetcher } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Textarea, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CoverLetterStatusBadge } from "@/components/status-badge";
import type { ApplicationDetail, CoverLetter, PreferencesWithProfile } from "@/types";
import type { CoverLetterTone } from "@/lib/coverLetterGenerator";
import { CoverLetterPrintModal } from "./cover-letter-print-modal";
import { FollowUpEmailModal } from "./follow-up-email-modal";
import { CoverLetterKeywordBooster } from "./cover-letter-keyword-booster";

const TONES: { value: CoverLetterTone; label: string }[] = [
  { value: "MODERN", label: "Modern (Lösungsorientiert)" },
  { value: "CLASSIC", label: "Klassisch (Formell/Konzern)" },
  { value: "STARTUP", label: "Startup / Agil (Dynamisch)" },
  { value: "DETAILED", label: "Detailliert (Umschulung & Tech-Fokus)" },
];

export function CoverLetterPanel({
  application,
  onChange,
}: {
  application: ApplicationDetail;
  onChange: () => void;
}) {
  const toast = useToast();
  const { data: preferences } = useSWR<PreferencesWithProfile>("/api/preferences", fetcher);

  const [content, setContent] = useState(application.coverLetter?.content ?? "");
  const [tone, setTone] = useState<CoverLetterTone>("MODERN");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);

  const coverLetter = application.coverLetter;
  const projectEntries = preferences?.projectEntries ?? [];

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await apiPost<CoverLetter>("/api/cover-letters/generate", {
        applicationId: application.id,
        tone,
        highlightProjectTitle: selectedProject || undefined,
      });
      setContent(result.content);
      onChange();
      toast.success("Anschreiben wurde neu generiert.");
    } catch {
      toast.error("Anschreiben konnte nicht generiert werden.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!coverLetter) return;
    setSaving(true);
    try {
      await apiPatch(`/api/cover-letters/${coverLetter.id}`, { content });
      onChange();
      toast.success("Anschreiben gespeichert.");
    } catch {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    if (!coverLetter) return;
    const nextStatus = coverLetter.status === "DRAFT" ? "SENT" : "DRAFT";
    try {
      await apiPatch(`/api/cover-letters/${coverLetter.id}`, { status: nextStatus });
      onChange();
      toast.success(nextStatus === "SENT" ? "Als gesendet markiert." : "Als Entwurf markiert.");
    } catch {
      toast.error("Status konnte nicht geändert werden.");
    }
  }

  function handleAddSentence(sentence: string) {
    if (!content) return;
    const parts = content.split("\n\n");
    if (parts.length > 2) {
      // Füge den Satz vor dem letzten Absatz ein
      parts.splice(parts.length - 2, 0, sentence);
      setContent(parts.join("\n\n"));
    } else {
      setContent(`${content}\n\n${sentence}`);
    }
    toast.success("Keyword-Satz ins Anschreiben eingefügt!");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Steuerungsleiste */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label htmlFor="tone-select" className="sr-only">
              Tonalität
            </label>
            <Select
              id="tone-select"
              value={tone}
              onChange={(e) => setTone(e.target.value as CoverLetterTone)}
              className="h-8 text-xs py-1 w-auto"
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          {projectEntries.length > 0 && (
            <div>
              <label htmlFor="project-select" className="sr-only">
                Hervorgehobenes Projekt
              </label>
              <Select
                id="project-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="h-8 text-xs py-1 w-auto"
              >
                <option value="">Standard-Projekt ({projectEntries[0]?.title})</option>
                {projectEntries.map((p) => (
                  <option key={p.id} value={p.title}>
                    Projekt: {p.title}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFollowUpModalOpen(true)}
            title="Nachfass-E-Mail bei fehlender Rückmeldung erstellen"
          >
            <Mail className="h-3.5 w-3.5" /> Nachfassen
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generating ? "Generiere …" : coverLetter ? "Neu generieren" : "Anschreiben generieren"}
          </Button>
        </div>
      </div>

      {coverLetter && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CoverLetterStatusBadge status={coverLetter.status} />
              <Button type="button" variant="ghost" size="sm" onClick={toggleStatus}>
                <Send className="h-3.5 w-3.5" />
                Als {coverLetter.status === "DRAFT" ? "gesendet" : "Entwurf"} markieren
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrintModalOpen(true)}
            >
              <Printer className="h-3.5 w-3.5" /> DIN 5008 Druck / PDF
            </Button>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            aria-label="Inhalt des Anschreibens"
            className="font-mono text-sm leading-relaxed"
          />

          <CoverLetterKeywordBooster
            coverLetterContent={content}
            jobDescription={application.jobPosting?.description}
            onAddSentence={handleAddSentence}
          />

          <div className="flex justify-end">
            <Button type="button" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Speichere …" : "Änderungen speichern"}
            </Button>
          </div>
        </>
      )}

      {!coverLetter && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <p>Noch kein Anschreiben vorhanden.</p>
          <p className="mt-1 text-xs">
            Wähle oben deinen gewünschten Stil und klicke auf „Anschreiben generieren“.
          </p>
        </div>
      )}

      {/* Druck-Modal */}
      {coverLetter && (
        <CoverLetterPrintModal
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          content={content}
          position={application.position}
          companyName={application.company.name}
        />
      )}

      {/* Nachfass-Modal */}
      <FollowUpEmailModal
        open={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        company={application.company}
        position={application.position}
        applicationDate={application.applicationDate}
      />
    </div>
  );
}
