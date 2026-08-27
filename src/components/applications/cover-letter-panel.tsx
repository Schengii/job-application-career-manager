"use client";

// -----------------------------------------------------------------------------
// Anschreiben-Panel: feste Vorlage, DIN 5008 Druck & Nachfass-Generator
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR from "swr";
import { Sparkles, Save, Send, Printer, Mail } from "lucide-react";
import { apiPost, apiPatch, fetcher } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CoverLetterStatusBadge } from "@/components/status-badge";
import type { ApplicationDetail, CoverLetter } from "@/types";
import { CoverLetterPrintModal } from "./cover-letter-print-modal";
import { FollowUpEmailModal } from "./follow-up-email-modal";
import { CoverLetterKeywordBooster } from "./cover-letter-keyword-booster";

export function CoverLetterPanel({
  application,
  onChange,
}: {
  application: ApplicationDetail;
  onChange: () => void;
}) {
  const toast = useToast();
  // Nur für den eigenen Namen im Betreff des "Als E-Mail öffnen"-Buttons
  // (handleOpenMailClient) benötigt.
  const { data: preferences } = useSWR<{ fullName: string | null }>("/api/preferences", fetcher);

  const [content, setContent] = useState(application.coverLetter?.content ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);

  const coverLetter = application.coverLetter;

  const [polishing, setPolishing] = useState(false);

  async function handleAiPolish() {
    if (!content) return;
    setPolishing(true);
    try {
      const result = await apiPost<{
        polishedContent: string;
        usedAi: boolean;
        modelUsed: string;
        improvements: string[];
      }>("/api/ai", {
        action: "POLISH_COVER_LETTER",
        coverLetter: content,
        jobTitle: application.position,
        jobDescription: application.jobPosting?.description,
        techStack: application.jobPosting?.techStack,
      });

      setContent(result.polishedContent);
      toast.success(
        result.usedAi
          ? `Anschreiben mit ${result.modelUsed} optimiert!`
          : "Anschreiben sprachlich geschärft (Offline-Heuristik)."
      );
    } catch {
      toast.error("KI-Optimierung fehlgeschlagen.");
    } finally {
      setPolishing(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await apiPost<CoverLetter>("/api/cover-letters/generate", {
        applicationId: application.id,
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

  function handleOpenMailClient() {
    if (!content) return;
    const recipient = application.company?.contactEmail || "";
    const subject = `Bewerbung als ${application.position} - ${preferences?.fullName ?? "Bewerber"}`;
    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
    window.location.href = mailtoUrl;
    toast.success("E-Mail-Programm geöffnet! Tipp: Vergiss nicht deine PDF-Unterlagen anzuhängen.");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Steuerungsleiste */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            Nutzt deine feste Anschreiben-Vorlage (Einstellungen → Profil & Präferenzen)
          </span>
          {application.company.letterTemplate && (
            <span className="text-[11px] font-medium text-primary" title={application.company.letterTemplate}>
              — eigener Einleitungssatz für {application.company.name} wird verwendet
            </span>
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

          {coverLetter && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiPolish}
              disabled={polishing || !content}
              title="Anschreiben mit KI oder Heuristik schärfen"
              className="border-primary/40 text-primary hover:bg-primary-soft"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {polishing ? "Optimiere …" : "Mit KI verfeinern ✨"}
            </Button>
          )}

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

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenMailClient}
                title="In deinem Standard-E-Mail-Programm (Outlook, Thunderbird, Mail-App) öffnen"
                className="text-xs card-hover-effect"
              >
                <Mail className="h-3.5 w-3.5 text-sky-500" /> Als E-Mail öffnen
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPrintModalOpen(true)}
              >
                <Printer className="h-3.5 w-3.5" /> DIN 5008 Druck / PDF
              </Button>
            </div>
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
