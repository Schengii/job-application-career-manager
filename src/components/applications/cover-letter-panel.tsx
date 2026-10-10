"use client";

// -----------------------------------------------------------------------------
// Anschreiben-Panel: feste Vorlage, DIN 5008 Druck & Nachfass-Generator
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import useSWR from "swr";
import { Sparkles, Save, Send, Printer, Mail, FileDown, Columns, AlertTriangle, CheckCircle2 } from "lucide-react";
import { apiPost, apiPatch, fetcher } from "@/lib/core/api";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CoverLetterStatusBadge } from "@/components/status-badge";
import type { ApplicationDetail, CoverLetter } from "@/types";
import { CoverLetterPrintModal } from "./cover-letter-print-modal";
import { FollowUpEmailModal } from "./follow-up-email-modal";
import { SendApplicationEmailModal } from "./send-application-email-modal";
import { CoverLetterKeywordBooster } from "./cover-letter-keyword-booster";
import { RequirementTailoringWidget } from "./requirement-tailoring-widget";
import { CoverLetterSnippetPicker } from "./cover-letter-snippet-picker";
import { CoverLetterDiffViewer } from "./cover-letter-diff-viewer";
import { calculateDin5008Metrics } from "@/lib/documents/din5008Guard";
import { generateEmlString, downloadEmlFile } from "@/lib/email/emlExport";
import { AtsKeywordMatcherModal } from "./ats-keyword-matcher-modal";
import { cn } from "@/lib/core/utils";

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
  const { data: preferences } = useSWR<{ fullName: string | null; email?: string | null }>("/api/preferences", fetcher);

  const [content, setContent] = useState(application.coverLetter?.content ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [smtpSendModalOpen, setSmtpSendModalOpen] = useState(false);
  const [atsMatcherOpen, setAtsMatcherOpen] = useState(false);

  const coverLetter = application.coverLetter;

  const [polishing, setPolishing] = useState(false);
  const [activeVariant, setActiveVariant] = useState<"A" | "B">("A");
  const [splitScreen, setSplitScreen] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<{ original: string; modified: string } | null>(null);

  const din5008Metrics = useMemo(() => calculateDin5008Metrics(content), [content]);

  function switchVariant(variant: "A" | "B") {
    if (variant === activeVariant) return;
    if (variant === "B") {
      localStorage.setItem(`cl_variant_a_${application.id}`, content);
      const savedB = localStorage.getItem(`cl_variant_b_${application.id}`) || "";
      setContent(savedB);
      setActiveVariant("B");
      toast.info("Zu Entwurf B (Alternativer Pitch) gewechselt.");
    } else {
      localStorage.setItem(`cl_variant_b_${application.id}`, content);
      const savedA = localStorage.getItem(`cl_variant_a_${application.id}`) || application.coverLetter?.content || "";
      setContent(savedA);
      setActiveVariant("A");
      toast.info("Zu Entwurf A (Hauptentwurf) gewechselt.");
    }
  }

  function handleExportEml() {
    if (!content) return;
    const recipient = application.company?.contactEmail || "";
    const subject = `Bewerbung als ${application.position} - ${preferences?.fullName ?? "Bewerber"}`;
    const emlContent = generateEmlString({
      to: recipient,
      from: preferences?.email || null,
      subject,
      body: content,
    });
    const filename = `bewerbung-${application.company.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.eml`;
    downloadEmlFile(filename, emlContent);
    toast.success(".eml Datei heruntergeladen! Mit 1 Klick in Outlook / Thunderbird öffnen.");
  }

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

      setPendingDiff({
        original: content,
        modified: result.polishedContent,
      });
      toast.success(
        result.usedAi
          ? `Anschreiben mit ${result.modelUsed} optimiert! Prüfe die Änderungen im Diff.`
          : "Anschreiben sprachlich geschärft (Offline-Heuristik). Prüfe die Änderungen im Diff."
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
      const result = await apiPost<CoverLetter & { usedAiForOpening: boolean }>("/api/cover-letters/generate", {
        applicationId: application.id,
      });
      setContent(result.content);
      onChange();
      toast.success(
        result.usedAiForOpening
          ? "Anschreiben generiert — Einleitungssatz individuell per KI formuliert."
          : "Anschreiben generiert — Einleitungssatz aus der Vorlage (kein KI-Provider konfiguriert oder Anfrage fehlgeschlagen)."
      );
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
            Fester Haupttext + individueller, per KI formulierter Einleitungssatz (Einstellungen → Profil & Präferenzen)
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

              {/* A/B Varianten-Umschalter */}
              <div className="flex items-center rounded-lg border border-border bg-surface p-0.5 ml-2">
                <button
                  type="button"
                  onClick={() => switchVariant("A")}
                  className={cn(
                    "px-2 py-0.5 text-xs font-semibold rounded-md transition-colors",
                    activeVariant === "A" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Entwurf A
                </button>
                <button
                  type="button"
                  onClick={() => switchVariant("B")}
                  className={cn(
                    "px-2 py-0.5 text-xs font-semibold rounded-md transition-colors",
                    activeVariant === "B" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Entwurf B (Alt)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSplitScreen(!splitScreen)}
                className={cn("text-xs", splitScreen && "bg-primary-soft text-primary font-semibold border-primary/40")}
                title="Split-Screen DIN 5008 Live-Vorschau an-/ausschalten"
              >
                <Columns className="h-3.5 w-3.5" /> Split-View
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSmtpSendModalOpen(true)}
                title="Bewerbung und PDF-Mappe direkt per E-Mail versenden"
                className="text-xs card-hover-effect border-sky-500/40 text-sky-600 dark:text-sky-400"
              >
                <Send className="h-3.5 w-3.5 text-sky-500" /> Direkt per E-Mail versenden 🚀
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportEml}
                title="Als .eml Datei herunterladen (direkt in Outlook/Thunderbird öffnen)"
                className="text-xs card-hover-effect"
              >
                <FileDown className="h-3.5 w-3.5 text-emerald-500" /> .eml Datei
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenMailClient}
                title="In deinem Standard-E-Mail-Programm (Outlook, Thunderbird, Mail-App) öffnen"
                className="text-xs card-hover-effect"
              >
                <Mail className="h-3.5 w-3.5 text-sky-500" /> Mailto
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAtsMatcherOpen(true)}
                title="Side-by-Side ATS Keyword Matching mit der Stellenanzeige"
                className="text-xs card-hover-effect border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> ATS Matcher
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

          {/* DIN 5008 1-Seiten-Wächter & Überlängen-Radar */}
          <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">DIN 5008 Seitenbelegung:</span>
                <span className={cn(
                  "font-bold",
                  din5008Metrics.status === "OPTIMAL" ? "text-emerald-600 dark:text-emerald-400" :
                  din5008Metrics.status === "WARNING" ? "text-amber-500" : "text-rose-500"
                )}>
                  {din5008Metrics.fillPercentage}% ({din5008Metrics.totalEstimatedLines}/{din5008Metrics.maxPageLines} Zeilen)
                </span>
                <span className={cn(
                  "rounded px-1.5 py-0.2 text-[10px] font-bold uppercase",
                  din5008Metrics.status === "OPTIMAL" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                  din5008Metrics.status === "WARNING" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {din5008Metrics.statusLabel}
                </span>
              </div>
              <span className="text-muted-foreground text-[11px]">
                {din5008Metrics.wordCount} Wörter · {din5008Metrics.characterCount} Zeichen
              </span>
            </div>

            {/* Fortschrittsbalken */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  din5008Metrics.status === "OPTIMAL" ? "bg-emerald-500" :
                  din5008Metrics.status === "WARNING" ? "bg-amber-500" : "bg-rose-500"
                )}
                style={{ width: `${Math.min(100, din5008Metrics.fillPercentage)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              {din5008Metrics.status === "OPTIMAL" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              {din5008Metrics.advice}
            </p>
          </div>

          {/* Diff-Viewer bei KI-Optimierung */}
          {pendingDiff && (
            <CoverLetterDiffViewer
              originalText={pendingDiff.original}
              modifiedText={pendingDiff.modified}
              onApply={(applied) => {
                setContent(applied);
                setPendingDiff(null);
                toast.success("Änderungen ins Anschreiben übernommen.");
              }}
              onCancel={() => {
                setPendingDiff(null);
                toast.info("Änderungen verworfen.");
              }}
            />
          )}

          {splitScreen ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground mb-1 block">Editor</span>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  aria-label="Inhalt des Anschreibens"
                  className="font-mono text-xs leading-relaxed h-[520px]"
                />
              </div>
              <div className="rounded-lg border border-border bg-white text-black p-6 shadow-xs h-[545px] overflow-y-auto font-sans text-xs leading-relaxed space-y-4">
                <div className="border-b border-gray-200 pb-3 text-gray-500 text-[10px]">
                  <strong>DIN 5008 Form B Vorschau</strong> · {application.company.name}
                </div>
                <div className="whitespace-pre-wrap font-sans text-gray-800">
                  {content}
                </div>
              </div>
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              aria-label="Inhalt des Anschreibens"
              className="font-mono text-sm leading-relaxed"
            />
          )}

          <RequirementTailoringWidget
            applicationId={application.id}
            onInsertParagraph={handleAddSentence}
          />

          <CoverLetterSnippetPicker onInsert={handleAddSentence} />

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
        applicationId={application.id}
        applicationDate={application.applicationDate}
        onInteractionAdded={onChange}
      />

      {/* SMTP E-Mail Direktversand Modal */}
      <SendApplicationEmailModal
        open={smtpSendModalOpen}
        onOpenChange={setSmtpSendModalOpen}
        application={application}
        senderName={preferences?.fullName || undefined}
        senderEmail={preferences?.email || undefined}
        onSent={onChange}
      />

      {/* ATS Keyword Matcher Modal */}
      <AtsKeywordMatcherModal
        open={atsMatcherOpen}
        onOpenChange={setAtsMatcherOpen}
        jobTitle={application.position}
        jobDescription={application.jobPosting?.description || application.jobPosting?.requirementsProfile || ""}
        coverLetterContent={content}
        cvText={preferences?.fullName ? `${preferences.fullName} - ${application.position}` : ""}
        onInsertSnippet={(snippet) => setContent((prev) => `${prev}${snippet}`)}
      />
    </div>
  );
}
