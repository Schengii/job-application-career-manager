"use client";

// -----------------------------------------------------------------------------
// Requirement Tailoring & Gap-to-Pitch Widget
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR from "swr";
import { Sparkles, CheckCircle2, AlertCircle, Plus, Copy, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { fetcher } from "@/lib/core/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { TailoringResult } from "@/lib/applications/requirementTailoring";

export function RequirementTailoringWidget({
  applicationId,
  onInsertParagraph,
}: {
  applicationId: string;
  onInsertParagraph: (text: string) => void;
}) {
  const toast = useToast();
  const { data, isLoading } = useSWR<TailoringResult>(
    applicationId ? `/api/applications/${applicationId}/tailor` : null,
    fetcher
  );

  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-xs text-muted-foreground animate-pulse">
        Analysiere Stellen-Anforderungen & Profile-Match …
      </div>
    );
  }

  if (!data || data.requirements.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-hover/30 p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-foreground">
              KI Requirement-Matching & Pitch-Tailoring
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Profil-Übereinstimmung:</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              data.overallMatchScore >= 75
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : data.overallMatchScore >= 50
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
            }`}
          >
            {data.overallMatchScore}% Match
          </span>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            title="Details ein-/ausblenden"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Quick Pitch Box */}
      <div className="rounded-lg border border-primary/20 bg-primary-soft/25 p-3 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-primary flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Maßgeschneiderter Argumentations-Absatz:
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(data.recommendedCoverLetterParagraph);
                toast.success("Absatz in Zwischenablage kopiert!");
              }}
              className="h-6 px-2 text-[10px]"
            >
              <Copy className="h-3 w-3 mr-1" /> Kopieren
            </Button>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => {
                onInsertParagraph(data.recommendedCoverLetterParagraph);
                toast.success("Absatz ins Anschreiben eingefügt!");
              }}
              className="h-6 px-2 text-[10px]"
            >
              <Plus className="h-3 w-3 mr-1" /> Ins Anschreiben einfügen
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed italic">
          „{data.recommendedCoverLetterParagraph}“
        </p>
      </div>

      {/* Detailierte Requirements Liste (wenn expandiert) */}
      {expanded && (
        <div className="space-y-2 pt-1 border-t border-border/50">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Erkannte Anforderungen im Detail:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.requirements.map((req, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-surface p-2.5 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    {req.status === "MATCHED" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                    {req.requirement}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      req.status === "MATCHED"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {req.status === "MATCHED" ? "Abgedeckt" : "Lern-Roadmap"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {req.evidence || req.pitchBullet}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
