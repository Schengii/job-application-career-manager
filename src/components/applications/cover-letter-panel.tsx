"use client";

import { useState } from "react";
import { Sparkles, Save, Send } from "lucide-react";
import { apiPost, apiPatch } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CoverLetterStatusBadge } from "@/components/status-badge";
import type { ApplicationDetail, CoverLetter } from "@/types";

export function CoverLetterPanel({
  application,
  onChange,
}: {
  application: ApplicationDetail;
  onChange: () => void;
}) {
  const toast = useToast();
  const [content, setContent] = useState(application.coverLetter?.content ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const coverLetter = application.coverLetter;

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await apiPost<CoverLetter>("/api/cover-letters/generate", {
        applicationId: application.id,
      });
      setContent(result.content);
      onChange();
      toast.success("Anschreiben wurde generiert.");
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Generiert automatisch ein Anschreiben aus Unternehmensdaten, Stellenanzeige und deinem Profil.
        </p>
        <Button type="button" variant="secondary" onClick={handleGenerate} disabled={generating}>
          <Sparkles className="h-4 w-4" /> {generating ? "Generiere …" : coverLetter ? "Neu generieren" : "Anschreiben generieren"}
        </Button>
      </div>

      {coverLetter && (
        <>
          <div className="flex items-center gap-2">
            <CoverLetterStatusBadge status={coverLetter.status} />
            <Button type="button" variant="ghost" size="sm" onClick={toggleStatus}>
              <Send className="h-3.5 w-3.5" />
              Als {coverLetter.status === "DRAFT" ? "gesendet" : "Entwurf"} markieren
            </Button>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            aria-label="Inhalt des Anschreibens"
            className="font-mono text-sm leading-relaxed"
          />

          <div className="flex justify-end">
            <Button type="button" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Speichere …" : "Änderungen speichern"}
            </Button>
          </div>
        </>
      )}

      {!coverLetter && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Noch kein Anschreiben vorhanden. Klicke oben auf „Anschreiben generieren“.
        </p>
      )}
    </div>
  );
}
