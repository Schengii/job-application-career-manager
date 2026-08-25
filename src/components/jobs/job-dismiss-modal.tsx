"use client";

import { useState, useMemo } from "react";
import {
  EyeOff,
  Building2,
  Tag,
  Code2,
  Ban,
  Check,
  Plus,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JOB_DISMISS_REASONS, type JobDismissReason } from "@/lib/constants";
import type { JobPostingWithCompany } from "@/types";
import { extractDismissalCandidates } from "@/lib/matching";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useSWRConfig } from "swr";

interface JobDismissModalProps {
  job: JobPostingWithCompany | null;
  open: boolean;
  onClose: () => void;
  onDismissed?: () => void;
}

function DismissForm({
  job,
  onClose,
  onDismissed,
}: {
  job: JobPostingWithCompany;
  onClose: () => void;
  onDismissed?: () => void;
}) {
  const toast = useToast();
  const { mutate } = useSWRConfig();

  const [reason, setReason] = useState<JobDismissReason>("TECH_MISMATCH");
  const [blacklistCompany, setBlacklistCompany] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [customKeywordInput, setCustomKeywordInput] = useState("");
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const candidates = useMemo(() => {
    return extractDismissalCandidates({
      title: job.title,
      description: job.description,
      techStack: job.techStack,
    });
  }, [job]);

  const availableKeywords = useMemo(() => {
    const set = new Set([...candidates.keywords, ...customKeywords]);
    return Array.from(set);
  }, [candidates.keywords, customKeywords]);

  const availableTech = candidates.tech;

  function toggleKeyword(kw: string) {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  }

  function toggleTech(t: string) {
    setSelectedTech((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  }

  function addCustomKeyword() {
    const trimmed = customKeywordInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!customKeywords.includes(trimmed)) {
      setCustomKeywords((prev) => [...prev, trimmed]);
    }
    if (!selectedKeywords.includes(trimmed)) {
      setSelectedKeywords((prev) => [...prev, trimmed]);
    }
    setCustomKeywordInput("");
  }

  async function handleDismiss() {
    setSubmitting(true);
    try {
      await apiPost(`/api/jobs/${job.id}/dismiss`, {
        reason,
        blacklistCompany,
        excludeKeywords: selectedKeywords,
        excludeTech: selectedTech,
      });

      await Promise.all([
        mutate("/api/jobs"),
        mutate("/api/jobs?includeDismissed=true"),
        mutate("/api/jobs?dismissedOnly=true"),
        mutate("/api/preferences"),
      ]);

      toast.success("Stellenangebot ausgeblendet und Ausschlusskriterien gelernt.");
      onDismissed?.();
      onClose();
    } catch {
      toast.error("Fehler beim Ausblenden des Stellenangebots.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Job Kurzinfo */}
      <div className="rounded-xl border border-border/80 bg-surface-hover/50 p-4">
        <p className="font-bold text-foreground text-sm leading-snug">{job.title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          {job.company?.name ?? "Unbekanntes Unternehmen"}
          {job.location && ` • ${job.location}`}
        </p>
      </div>

      {/* 1. Hauptgrund */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-foreground">
          Warum passt dieses Stellenangebot nicht?
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {JOB_DISMISS_REASONS.map((r) => {
            const active = reason === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border bg-surface hover:bg-surface-hover text-foreground"
                }`}
              >
                <span>{r.label}</span>
                {active && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-1.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Firmen-Blacklist */}
      {job.company?.name && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={blacklistCompany}
              onChange={(e) => setBlacklistCompany(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-rose-600 focus:ring-rose-500"
            />
            <div>
              <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                <Ban className="h-3.5 w-3.5" />
                „{job.company.name}“ dauerhaft auf die Blacklist setzen
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Zukünftige und bestehende Angebote dieses Unternehmens werden automatisch ausgeblendet und erhalten einen Match-Score von 0%.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* 3. Negative Keywords & Begriffe */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-amber-500" />
            Unerwünschte Suchbegriffe / Keywords ausschließen:
          </label>
          <span className="text-[11px] text-muted-foreground">Klicken zum Auswählen</span>
        </div>

        <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg border border-border bg-surface-hover/30">
          {availableKeywords.length === 0 ? (
            <span className="text-[11px] text-muted-foreground italic">
              Keine typischen Ausschluss-Keywords im Text gefunden. Unten manuell ergänzen.
            </span>
          ) : (
            availableKeywords.map((kw) => {
              const selected = selectedKeywords.includes(kw);
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => toggleKeyword(kw)}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selected
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-surface border border-border/80 text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {kw}
                </button>
              );
            })
          )}
        </div>

        {/* Eigenes Keyword hinzufügen */}
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Weiteren Begriff ausschließen (z. B. 'Zeitarbeit', 'Schicht') …"
            value={customKeywordInput}
            onChange={(e) => setCustomKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomKeyword();
              }
            }}
            className="h-8 flex-1 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addCustomKeyword}
            disabled={!customKeywordInput.trim()}
            className="h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Hinzufügen
          </Button>
        </div>
      </div>

      {/* 4. Unerwünschte Technologien */}
      {availableTech.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-indigo-500" />
              Unerwünschte Technologien / Frameworks abwerten:
            </label>
            <span className="text-[11px] text-muted-foreground">Klicken zum Abwählen</span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border bg-surface-hover/30">
            {availableTech.map((t) => {
              const selected = selectedTech.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTech(t)}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-surface border border-border/80 text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
          Abbrechen
        </Button>
        <Button
          size="sm"
          onClick={handleDismiss}
          disabled={submitting}
          className="bg-rose-600 hover:bg-rose-700 text-white card-hover-effect"
        >
          <EyeOff className="h-3.5 w-3.5" />
          <span>{submitting ? "Wird verarbeitet …" : "Ausblenden & Filter lernen"}</span>
        </Button>
      </div>
    </div>
  );
}

export function JobDismissModal({ job, open, onClose, onDismissed }: JobDismissModalProps) {
  if (!job) return null;

  return (
    <Dialog open={open} onClose={onClose} title="Stellenangebot ausblenden & Filter lernen">
      <DismissForm
        key={job.id}
        job={job}
        onClose={onClose}
        onDismissed={onDismissed}
      />
    </Dialog>
  );
}
